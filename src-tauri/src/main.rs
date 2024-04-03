// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::message::ServerMessage;
use twitch_irc::ClientConfig;

use tauri::Manager;

extern crate dotenv;
use dotenv::dotenv;
use std::env;

use charon::TIRCCredentials;

mod config;
use config::Config;

mod commands;

#[derive(Clone, serde::Serialize)]
struct MessagePayload {
    sender_nick: String,
    color: String,
    message: String,
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    let config = ClientConfig::default();
    let (mut incoming_messages, anon_client) = TIRCCredentials::new(config);

    let (_, client) = TIRCCredentials::new(ClientConfig::new_simple(StaticLoginCredentials::new(
        std::env::var("TWITCH.USERNAME").unwrap(),
        Some(std::env::var("TWITCH.OAUTH").unwrap()),
    )));

    let config = Config::from_config_file().unwrap();

    for c in &config.channels {
        client.join(c.clone()).unwrap();
        anon_client.join(c.clone()).unwrap();
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            app_handle.manage(client);
            app_handle.manage(Mutex::new(anon_client));
            app_handle.manage(Mutex::new(config));

            tokio::spawn(async move {
                while let Some(message) = incoming_messages.recv().await {
                    // println!("Received message: {:?}", message);
                    match message {
                        ServerMessage::Privmsg(privmsg) => {
                            let event_name = format!("chat-msg__{}", privmsg.channel_login);
                            let color = if let Some(c) = privmsg.name_color {
                                c.to_string()
                            } else {
                                "#575757".into()
                            };

                            app_handle
                                .emit_all(
                                    &event_name,
                                    MessagePayload {
                                        sender_nick: privmsg.sender.name,
                                        message: privmsg.message_text,
                                        color: color,
                                    },
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
