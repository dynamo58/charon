use crate::data::Dataset;
use crate::handle_received_message;
use std::sync::Arc;
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex as TMutex;
use twitch_irc::message::ServerMessage;

use tauri::State;
use tracing::info;

use std::io::{BufRead, BufReader};
use std::io::{Read, Write};
use std::net::SocketAddr;
use std::net::TcpListener;
use std::net::TcpStream;

use crate::config::Config;
use crate::Connections;

use crate::apis::recent_messages;

#[tauri::command]
pub async fn send_message<'a>(
    channel_name: String,
    message: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
) -> Result<String, String> {
    info!("sending message to #{channel_name}");

    let c = Arc::clone(&conns);
    let c = c.lock().await;
    if let None = &c.authed {
        return Err("Error: not logged in.".into());
    }
    let c = c.authed.as_ref().unwrap();

    c.client.say(channel_name, message).await.unwrap();

    Ok("Message sent successfully".into())
}

#[tauri::command]
pub async fn join_channel(
    channel_name: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
) -> Result<String, String> {
    info!("joining #{channel_name}");

    let c = Arc::clone(&conns);
    let c = c.lock().await;
    if let None = &c.authed {
        return Err("Error: not logged in.".into());
    }
    let conn = c.authed.as_ref().unwrap();
    let mut data = dataset.lock().await;

    data.add_channel(&conn.helix_user_token, &conn.helix, channel_name.clone())
        .await
        .unwrap();

    c.anon_client.join(channel_name.clone()).unwrap();
    conn.client.join(channel_name).unwrap();

    Ok("Channel joined.".into())
}

#[tauri::command]
// will stream recent messages to the given channel (using external API)
pub async fn get_recent_messages(
    channel_name: String,
    app_handle: tauri::AppHandle,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
) -> Result<String, String> {
    info!("fetching recent messages for #{channel_name}");

    let c = Arc::clone(&dataset);

    if let Ok(msgs_res) = recent_messages::fetch(channel_name).await {
        for msg in msgs_res.messages {
            let irc_msg = twitch_irc::message::IRCMessage::parse(msg.as_str()).unwrap();
            let server_msg = ServerMessage::try_from(irc_msg).unwrap();
            handle_received_message(&app_handle, server_msg, &c.lock().await.to_owned());
        }

        Ok("Messages transmitted successfully.".into())
    } else {
        Err("Failed to fetch recent messages.".into())
    }
}

#[tauri::command]
pub async fn part_channel(
    channel_name: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
) -> Result<bool, ()> {
    info!("parting #{channel_name}");

    let c = conns.lock().await;
    let mut data = dataset.lock().await;

    data.remove_channel(channel_name.clone());
    c.anon_client.part(channel_name);

    Ok(true)
}

#[tauri::command]
pub async fn fetch_config(config: State<'_, Arc<TMutex<Config>>>) -> Result<String, String> {
    info!("fetching config");

    let config = config.lock().await;

    if let Ok(json_str) = serde_json::to_string(&*config) {
        Ok(json_str)
    } else {
        Err("Error serializing config".into())
    }
}

#[tauri::command]
pub async fn save_config(
    json_str: String,
    config: State<'_, Arc<TMutex<Config>>>,
) -> Result<String, String> {
    info!("saving config");
    let json = {
        if let Ok(j) = serde_json::from_str::<Config>(&json_str) {
            j
        } else {
            return Err("Error: provided config couldn't be serialized".into());
        }
    };

    let mut curr = config.lock().await;

    *curr = json;

    match (*curr).save_to_file() {
        Ok(_) => Ok("Config saved successfully".into()),
        Err(_) => Err("Error: couldn't save config".into()),
    }
}

fn get_http_body_from_tcpstream(stream: &TcpStream) -> String {
    let mut reader = BufReader::new(stream.try_clone().unwrap());
    let mut name = String::new();
    loop {
        let r = reader.read_line(&mut name).unwrap();
        if r < 3 {
            //detect empty line
            break;
        }
    }
    let mut size = 0;
    let linesplit = name.split("\n");
    for l in linesplit {
        if l.starts_with("Content-Length") {
            let sizeplit = l.split(":");
            for s in sizeplit {
                if !(s.starts_with("Content-Length")) {
                    size = s.trim().parse::<usize>().unwrap(); //Get Content-Length
                }
            }
        }
    }
    let mut buffer = vec![0; size]; //New Vector with size of Content
    reader.read_exact(&mut buffer).unwrap(); //Get the Body Content.

    String::from_utf8_lossy(&buffer).to_string()
}

fn try_get_token(mut stream: TcpStream) -> Option<String> {
    let body = get_http_body_from_tcpstream(&stream);

    if body.is_empty() {
        // body is empty, therefore it must be the inital request when
        // the user gets only redirected there from twitch auth website
        let res = format!(
            "{}{}",
            "HTTP/1.1 200 OK\r\n\r\n",
            include_str!("static/twitch_auth_local_website.html")
        );
        stream.write_all(res.as_bytes()).unwrap();
        stream.flush().unwrap();

        None
    } else {
        // there is some body passed, that means its the second request
        // where the JS itself is sending the hash

        let res = "HTTP/1.1 200 OK\r\n\r\n";
        stream.write_all(res.as_bytes()).unwrap();
        stream.flush().unwrap();

        Some(
            // parse out the token, which is passed as a whole bundle
            // of url params for reasons
            body.split('=')
                .nth(1)
                .unwrap()
                .split('&')
                .nth(0)
                .unwrap()
                .to_string(),
        )
    }
}

#[tauri::command]
pub async fn authentificate(
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
    config: State<'_, Arc<TMutex<Config>>>,
    app_handle: tauri::AppHandle,
    token: Option<String>,
) -> Result<String, String> {
    info!("authentificating");

    let mut token = token.clone();
    if let None = token {
        info!("no token, starting the twitch auth process");

        let listener = TcpListener::bind(SocketAddr::from(([127, 0, 0, 1], 32995))).unwrap();

        for stream in listener.incoming() {
            match stream {
                Ok(stream) => {
                    if let Some(tok) = try_get_token(stream) {
                        info!("got token from proxy");
                        token = Some(tok);
                        break;
                    }
                }
                Err(e) => {
                    tracing::error!("Error: {}", e);
                    return Err(
                        "Error: failed to initiate local receiver for Twitch auth service".into(),
                    );
                }
            }
        }
    }

    let token = token.unwrap();

    // send the token to the client, so they can store it and recall
    // upon application restart
    app_handle.emit_all("token", token.clone()).unwrap();

    info!("initing everything with credentials");
    let mut conns = conns.inner().lock().await;
    conns.with_token(token.clone()).await.unwrap();

    let mut data = dataset.inner().lock().await;
    let config = config.inner().lock().await;

    if let Some(a) = &conns.authed {
        (*data) = Dataset::from_config(&config, &a.helix_user_token, &a.helix)
            .await
            .unwrap();

        for c in &config.channels {
            a.client.join(c.clone()).unwrap();
        }
    }

    Ok(token)
}

#[tauri::command]
pub fn open_preferences_window(app_handle: AppHandle) -> Result<String, String> {
    let res = tauri::WindowBuilder::new(
        &app_handle,
        "preferences",
        tauri::WindowUrl::App("/preferences".into()),
    )
    .build();

    match res {
        Ok(_) => Ok("config window spawned successfully".into()),
        Err(e) => {
            tracing::error!("failed spawning config window | error: {e}");
            Err("failed spawning config window".into())
        }
    }
}

#[tauri::command]
pub fn close_preferences_window(app_handle: AppHandle) {
    let cfg_window = app_handle.get_window("preferences");

    if let Some(window) = cfg_window {
        window.close().unwrap();
    }
}
