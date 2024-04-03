use std::{
    fs::{self, File},
    io::{Read, Write},
};

use serde::{Deserialize, Serialize};

extern crate directories;
use directories::ProjectDirs;

use anyhow::{self, Context};

use tracing::info;

#[derive(Clone, Serialize, Deserialize)]
pub struct Config {
    pub channels: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self { channels: vec![] }
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
            let json = serde_json::to_string(&config)?;
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
        let json = serde_json::to_string(&self)?;
        file.write_all(json.as_bytes())?;

        Ok(())
    }
}
