use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::Mutex as TMutex;

use tauri::State;
use tracing::info;

use crate::config::Config;
use charon::Connections;

#[tauri::command]
pub async fn send_message<'a>(
    channel_name: String,
    message: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
) -> Result<String, String> {
    info!("client is sending message to #{}", &channel_name);

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
) -> Result<String, String> {
    info!("client is joining #{}", &channel_name);

    let c = Arc::clone(&conns);

    let res = {
        let guard = c.lock().await;
        guard.anon_client.join(channel_name)
    };

    match res {
        Ok(_) => Ok("Channel joined.".into()),
        Err(_) => Err("Error joining channel.".into()),
    }
}

#[tauri::command]
pub async fn part_channel(
    channel_name: String,
    conns: State<'_, Arc<TMutex<Connections<'_>>>>,
) -> Result<bool, ()> {
    info!("client is parting #{}", &channel_name);

    let c = Arc::clone(&conns);

    {
        let guard = c.lock().await;
        guard.anon_client.part(channel_name);
    }

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
