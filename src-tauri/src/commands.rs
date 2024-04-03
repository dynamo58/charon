use std::sync::Mutex;

use tauri::State;
use tracing::info;

use crate::config::Config;
use charon::Client;

#[tauri::command]
pub async fn send_message(
    channel_name: String,
    message: String,
    client: State<'_, Client>,
) -> Result<bool, ()> {
    info!("client is sending message to #{}", &channel_name);
    let res = client.inner().say(channel_name, message).await;

    match res {
        Ok(_) => Ok(true),
        Err(_) => Err(()),
    }
}

#[tauri::command]
pub fn join_channel(
    channel_name: String,
    anon_client: State<'_, Mutex<Client>>,
) -> Result<bool, ()> {
    info!("client is joining #{}", &channel_name);
    let res = anon_client.inner().lock().unwrap().join(channel_name);

    match res {
        Ok(_) => Ok(true),
        Err(_) => Err(()),
    }
}

#[tauri::command]
pub fn part_channel(
    channel_name: String,
    anon_client: State<'_, Mutex<Client>>,
) -> Result<bool, ()> {
    info!("client is parting #{}", &channel_name);
    anon_client.inner().lock().unwrap().part(channel_name);
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
