// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::message::ServerMessage;
use twitch_irc::ClientConfig;

use tauri::Manager;

use tracing::info;
use tracing_subscriber;

extern crate dotenv;
use dotenv::dotenv;
use std::env;

use charon::TIRCCredentials;

mod commands;
mod config;
mod payload;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    dotenv().ok();

    let config = ClientConfig::default();
    let (mut incoming_messages, anon_client) = TIRCCredentials::new(config);

    info!("inited anon client");

    let (_, client) = TIRCCredentials::new(ClientConfig::new_simple(StaticLoginCredentials::new(
        std::env::var("TWITCH.USERNAME").unwrap(),
        Some(std::env::var("TWITCH.OAUTH").unwrap()),
    )));

    info!("inited user client");

    let config = config::Config::from_config_file().unwrap();

    for c in &config.channels {
        client.join(c.clone()).unwrap();
        anon_client.join(c.clone()).unwrap();
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            app_handle.manage(client);
            // this mutex is completely unncessary, it is only there becausi the tauri manager
            // cannot differentiate between more managed items of the same type.
            // TODO: refactor for them to be... part of a common struct that would get
            // passed around instead?
            app_handle.manage(Mutex::new(anon_client));
            app_handle.manage(Mutex::new(config));

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
