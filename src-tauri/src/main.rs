// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use std::sync::Mutex;
use tokio::sync::Mutex as TMutex;

use tracing_subscriber;

extern crate dotenv;
use dotenv::dotenv;
use std::env;

mod apis;
mod badge;
mod commands;
mod config;
mod data;
mod payload;
mod shared;

use data::Dataset;
use shared::handle_received_message;
use shared::Connections;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    dotenv().ok();

    let (mut incoming_messages, connections) = Connections::from_env_vars().await.unwrap();
    let config = config::Config::from_config_file().unwrap();

    for c in &config.channels {
        connections.anon_client.join(c.clone()).unwrap();
    }

    let data = Dataset::from_config(&config, &connections.helix_user_token, &connections.helix)
        .await
        .expect("to gather config data successfully");

    let data = Arc::new(TMutex::new(data));
    let data2 = data.clone();

    tauri::Builder::default()
        .setup(move |app| {
            let app_handle = app.handle();

            let data3 = data2.clone();
            tokio::spawn(async move {
                {
                    while let Some(message) = incoming_messages.recv().await {
                        println!("Received some message");
                        // println!("Received message: {:#?}", message);

                        handle_received_message(
                            &app_handle,
                            message,
                            &data3.lock().await.to_owned(),
                        );
                    }
                }
            });

            Ok(())
        })
        .manage(Mutex::new(config))
        .manage(data)
        .manage(Arc::new(TMutex::new(connections)))
        .invoke_handler(tauri::generate_handler![
            commands::send_message,
            commands::get_recent_messages,
            commands::join_channel,
            commands::part_channel,
            commands::fetch_config,
            commands::save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
