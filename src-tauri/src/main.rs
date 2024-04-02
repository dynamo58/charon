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
use std::sync::Mutex;

#[derive(Clone, Default)]
struct Config {
    channels: Vec<String>,
}

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

#[tauri::command]
fn join_channel(channel_name: String, anon_client: State<'_, Mutex<Client>>) -> Result<bool, ()> {
    let res = anon_client.inner().lock().unwrap().join(channel_name);

    match res {
        Ok(_) => Ok(true),
        Err(_) => Err(()),
    }
}

#[tauri::command]
fn part_channel(channel_name: String, anon_client: State<'_, Mutex<Client>>) -> Result<bool, ()> {
    anon_client.inner().lock().unwrap().part(channel_name);
    Ok(true)
}

#[tauri::command]
fn fetch_config(config: State<'_, Config>) -> Config {
    config.inner().clone()
}

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

    let config = Config {
        channels: vec!["pepega00000".into(), "gkey".to_string()],
    };

    for c in config.channels {
        client.join(c.clone()).unwrap();
        anon_client.join(c.clone()).unwrap();
    }

    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();

            app_handle.manage(client);
            app_handle.manage(Mutex::new(anon_client));

            tokio::spawn(async move {
                while let Some(message) = incoming_messages.recv().await {
                    println!("Received message: {:?}", message);
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
            send_message,
            join_channel,
            part_channel
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
