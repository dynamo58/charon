// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::message::ServerMessage;
use twitch_irc::transport::tcp::{TCPTransport, TLS};
use twitch_irc::TwitchIRCClient;
use twitch_irc::{ClientConfig, SecureTCPTransport};

type Client = TwitchIRCClient<TCPTransport<TLS>, StaticLoginCredentials>;
type TIRCCredentials = TwitchIRCClient<SecureTCPTransport, StaticLoginCredentials>;

use tauri::{Manager, State};

extern crate dotenv;
use dotenv::dotenv;
use std::env;

#[tauri::command]
async fn send_message(
    channel_name: String,
    message: String,
    client: State<'_, Client>,
) -> Result<bool, ()> {
    let res = client.inner().say(channel_name, message).await;

    match res {
        Ok(_) => Ok(true),
        Err(_) => Err(()),
    }
}

#[derive(Clone, serde::Serialize)]
struct MessagePayload {
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

    anon_client.join("pepega00000".to_owned()).unwrap();

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            app_handle.manage(client);

            tokio::spawn(async move {
                while let Some(message) = incoming_messages.recv().await {
                    println!("Received message: {:?}", message);
                    match message {
                        ServerMessage::Privmsg(privmsg) => {
                            app_handle
                                .emit_all(
                                    "chat-msg",
                                    MessagePayload {
                                        message: privmsg.message_text,
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
        .invoke_handler(tauri::generate_handler![send_message])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
