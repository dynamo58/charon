use crate::data::Dataset;
use crate::handle_received_message;
use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::Mutex as TMutex;
use twitch_irc::message::ServerMessage;

use tauri::State;
use tracing::info;

use crate::config::Config;
use crate::Connections;

use crate::apis::recent_messages;

#[tauri::command]
pub async fn send_message<'a>(
    channel_name: String,
    message: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
) -> Result<String, String> {
    info!("client is sending message to #{channel_name}");

    let c = Arc::clone(&conns);

    let res = {
        let guard = c.lock().await;
        guard.client.say(channel_name, message).await
    };

    match res {
        Ok(_) => Ok("Message sent successfully".into()),
        Err(_) => Err("Error sending message".into()),
    }
}

#[tauri::command]
pub async fn join_channel(
    channel_name: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
) -> Result<String, String> {
    info!("client is joining #{}", &channel_name);

    let c = conns.lock().await;
    let mut data = dataset.lock().await;

    data.add_channel(&c.helix_user_token, &c.helix, channel_name.clone())
        .await
        .unwrap(); // TODO: erm

    let res = c.anon_client.join(channel_name);

    match res {
        Ok(_) => Ok("Channel joined.".into()),
        Err(_) => Err("Error joining channel.".into()),
    }
}

#[tauri::command]
/// will stream recent messages to the given channel (using external API)
pub async fn get_recent_messages(
    channel_name: String,
    app_handle: tauri::AppHandle,
    dataset: State<'_, Arc<TMutex<Dataset>>>,
) -> Result<String, String> {
    info!("client wants recent messages for #{channel_name}");

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
    info!("client is parting #{channel_name}");

    let c = conns.lock().await;
    let mut data = dataset.lock().await;

    data.remove_channel(channel_name.clone());
    c.anon_client.part(channel_name);

    Ok(true)
}

#[tauri::command]
pub fn fetch_config(config: State<'_, Mutex<Config>>) -> Result<String, String> {
    info!("client is fetching config");

    if let Ok(json_str) = serde_json::to_string(config.inner()) {
        Ok(json_str)
    } else {
        Err("Error serializing config".into())
    }
}

#[tauri::command]
pub fn save_config(json_str: String, config: State<'_, Mutex<Config>>) -> Result<String, String> {
    info!("client is saving config");
    let json = {
        if let Ok(j) = serde_json::from_str::<Config>(&json_str) {
            j
        } else {
            return Err("Error: provided config couldn't be serialized".into());
        }
    };

    let mut curr = config.inner().lock().unwrap();

    *curr = json;

    match (*curr).save_to_file() {
        Ok(_) => Ok("okidoki".into()),
        Err(_) => Err("Error: couldn't save config".into()),
    }
}
