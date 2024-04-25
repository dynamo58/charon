use std::{
    fs::{self, File},
    io::{Read, Write},
};

use serde::{Deserialize, Serialize};

extern crate directories;
use directories::ProjectDirs;

use anyhow::{self, Context};

use tracing::info;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Backdrop {
    pub property: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum Platform {
    YouTube,
    Twitch,
    Kick,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Tab {
    pub label: String,
    pub ident: String,
    pub uuid: String,
    pub platform: Platform,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Config {
    pub tabs: Vec<Tab>,
    pub font_ui: String,
    pub font_chat: String,
    pub font_scale: f32,
    pub backdrop: Backdrop,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            tabs: vec![],
            font_ui: String::from("Arial"),
            font_chat: String::from("Arial"),
            font_scale: 1f32,
            backdrop: Backdrop {
                property: String::from("none"),
            },
        }
    }
}

impl Config {
    // makes sure that the config dir is properly structured
    fn scaffold_dir() -> anyhow::Result<std::path::PathBuf> {
        let proj_dirs = ProjectDirs::from("org", "gh_dynamo58", "charon")
            .context("Error: couldn't get home directory")?;

        let config_dir = proj_dirs.config_dir();
        let config_file = config_dir.join("config.json");

        // make sure the config dir exists
        if !config_dir.exists() {
            fs::create_dir_all(config_dir)?;
        }

        // make sure the config file exists
        if !config_file.exists() {
            // TODO: handle not being a file?

            let mut file = File::create(config_file)?;
            let config = Self::default();
            let json = serde_json::to_string_pretty(&config)?;
            file.write_all(json.as_bytes())?;
        }

        Ok(config_dir.to_path_buf())
    }

    pub fn from_config_file() -> anyhow::Result<Config> {
        info!("fetching config from file");
        let config_dir = Self::scaffold_dir()?;
        let config_file = config_dir.join("config.json");

        let mut file = File::open(config_file)?;
        let mut json_str = String::new();
        file.read_to_string(&mut json_str)?;
        let json = serde_json::from_str(&json_str)?;

        Ok(json)
    }

    pub fn save_to_file(&self) -> anyhow::Result<()> {
        info!("saving config to file");
        let config_dir = Self::scaffold_dir()?;
        let config_file = config_dir.join("config.json");

        let mut file = File::create(config_file)?;
        let json = serde_json::to_string_pretty(&self)?;
        file.write_all(json.as_bytes())?;

        Ok(())
    }
}
