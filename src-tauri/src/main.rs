// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::Mutex as TMutex;

use twitch_irc::message::ServerMessage;

use tauri::Manager;

use tracing_subscriber;

extern crate dotenv;
use dotenv::dotenv;
use std::env;

use charon::Connections;

mod commands;
mod config;
mod payload;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    dotenv().ok();

    let (mut incoming_messages, connections) = Connections::from_env_vars().await.unwrap();
    let config = config::Config::from_config_file().unwrap();

    for c in &config.channels {
        connections.anon_client.join(c.clone()).unwrap();
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            app_handle.manage(Mutex::new(config));
            app_handle.manage(Arc::new(TMutex::new(connections)));

            tokio::spawn(async move {
                while let Some(message) = incoming_messages.recv().await {
                    println!("Received message: {:#?}", message);
                    match message {
                        ServerMessage::Privmsg(privmsg) => {
                            let event_name = format!("privmsg__{}", privmsg.channel_login);
                            app_handle
                                .emit_all(
                                    &event_name,
                                    payload::PrivmsgPayload::from_privmsg(privmsg),
                                )
                                .unwrap();
                        }
                        ServerMessage::UserNotice(usrnotice) => {
                            let event_name = format!("usernotice__{}", usrnotice.channel_login);
                            app_handle
                                .emit_all(
                                    &event_name,
                                    payload::UsernoticePayload::from_usernotice(usrnotice),
                                )
                                .unwrap();
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::send_message,
            commands::join_channel,
            commands::part_channel,
            commands::fetch_config,
            commands::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
