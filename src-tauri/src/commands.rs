use crate::data::Dataset;
use crate::payload::SystemMessage;
use crate::shared::handle_received_message;
use crate::shared::Levenshtein;
use std::collections::HashSet;
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
use crate::shared::Connections;

use crate::apis::recent_messages;

pub fn report(handle: &AppHandle, channel_name: &str, msg: String) {
    handle
        .emit_all(
            &format!("sysmsg__{}", channel_name),
            SystemMessage { message: msg },
        )
        .unwrap();
}

// pub enum ReportableError {
//     Recoverable(String),
//     Fatal(String),
// }

// trait MakeReport {
//     fn make_report(&self, handle: AppHandle, channel_name: &str);
// }

// impl MakeReport for Vec<ReportableError> {
//     fn make_report(&self, handle: AppHandle, channel_name: &str) {
//         let _ = &self.iter().for_each(|e| match e {
//             ReportableError::Fatal(s) => report(&handle, channel_name, format!("⚠️ FATAL: {s}")),
//             ReportableError::Recoverable(s) => {
//                 report(&handle, channel_name, format!("⚠️ ERROR: {s}"))
//             }
//         });
//     }
// }

// pub enum ReportableResult {
//     Ok,
//     Err(Vec<ReportableError>),
// }

// impl ReportableResult {
//     pub fn consume(&self, app_handle: AppHandle, channel_name: &str) {
//         match self {
//             Self::Ok => (),
//             Self::Err(e) => e.make_report(app_handle, channel_name),
//         }
//     }
// }

// TODO: make frontend call `ready` to init, move shit from main into there

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
    handle: AppHandle,
) -> Result<String, String> {
    info!("joining #{channel_name}");

    let c = Arc::clone(&conns);
    let c = c.lock().await;
    if let None = &c.authed {
        return Err("Error: not logged in.".into());
    }
    let conn = c.authed.as_ref().unwrap();
    let mut data = dataset.lock().await;

    data.add_channel(&conn.helix_user_token, &conn.helix, &channel_name, &handle)
        .await;

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
        app_handle
            .emit_all("conn_info", a.helix_user_token.login.to_string())
            .unwrap();
        (*data) = Dataset::from_config(&config, &a.helix_user_token, &a.helix, &app_handle)
            .await
            .unwrap();

        for tab in &config.tabs {
            a.client.join(tab.ident.clone()).unwrap();
        }
    }

    Ok(token)
}

#[tauri::command]
pub fn open_preferences_window(app_handle: AppHandle) -> Result<String, String> {
    info!("opening preferences window");

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
    info!("closing preferences windows");

    let cfg_window = app_handle.get_window("preferences");

    if let Some(window) = cfg_window {
        window.close().unwrap();
    }
}

#[tauri::command]
pub fn get_system_fonts() -> Result<String, String> {
    info!("querying system fonts");

    let mut db = fontdb::Database::new();
    db.load_system_fonts();

    let mut families = db
        .faces()
        .map(|f| f.families[0].0.clone())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect::<Vec<String>>();
    families.sort();

    Ok(serde_json::to_string(&families).unwrap())
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct Preferences {
    font: String,
}

// given a substring, match all emotes (within the current context)
// that include the given string as part of their code
#[tauri::command]
pub async fn query_emotes(
    s: String,
    channel_login: String,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    info!("querying emotes on {channel_login} matching '{s}'");
    let data = dataset.lock().await;

    match data.query_emote_from_substr(&channel_login, &s) {
        Some(es) => {
            let mut es = es.clone();
            es.sort_by_levenshtein(&s);

            let ser = serde_json::to_string(&es);

            if ser.is_err() {
                report(
                    &app_handle,
                    &channel_login,
                    "unknown; matching emote names".into(),
                );
                return Err("Error".into());
            }

            Ok(ser.unwrap())
        }

        None => {
            report(
                &app_handle,
                &channel_login,
                "channel not in database; matching emote names".into(),
            );
            Err("Error".into())
        }
    }
}

#[tauri::command]
pub fn generate_uuid() -> Result<String, String> {
    Ok(uuid::Uuid::new_v4().to_string())
}
