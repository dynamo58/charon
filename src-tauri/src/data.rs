use std::collections::HashMap;

use crate::{
    apis::{
        adamcy::get_all_3rd_party_channel_emotes,
        helix::{get_channel_badges_from_id, get_global_badges},
    },
    shared,
};
use twitch_api::{helix::channels::ChannelInformation, twitch_oauth2::UserToken, HelixClient};

use anyhow::Context;

use crate::{badge::NativeBadgeSet, config::Config};

#[derive(Debug, Clone, serde::Deserialize)]
pub struct ChannelData {
    pub info: ChannelInformation,
    pub badges: NativeBadgeSet,
    pub third_party_emotes: HashMap<String, String>,
}

#[derive(Debug, Clone, serde::Deserialize, Default)]
pub struct Dataset {
    pub channel_data: HashMap<String, ChannelData>,
    pub global_badges: NativeBadgeSet,
    // pub emotes: EmoteRepertoire,
}

impl Dataset {
    pub async fn from_config(
        config: &Config,
        auth: &UserToken,
        helix_client: &HelixClient<'_, reqwest::Client>,
    ) -> anyhow::Result<Self> {
        let mut result = Dataset::default();

        for c in &config.channels {
            result.add_channel(auth, helix_client, c.into()).await?;
        }

        result.global_badges = get_global_badges(auth).await?;

        Ok(result)
    }

    pub fn remove_channel(&mut self, channel_name: String) {
        self.channel_data.remove(&channel_name);
    }

    pub async fn add_channel(
        &mut self,
        auth: &UserToken,
        helix_client: &HelixClient<'_, reqwest::Client>,
        channel_name: String,
    ) -> anyhow::Result<()> {
        let info = helix_client
            .get_channel_from_login(&channel_name, auth)
            .await?
            .context("oopsie")
            .unwrap();
        let badges = get_channel_badges_from_id(info.broadcaster_id.to_string(), &auth)
            .await
            .unwrap();
        let third_party_emotes = get_all_3rd_party_channel_emotes(info.broadcaster_login.as_str())
            .await
            .unwrap();

        self.channel_data.insert(
            channel_name.clone(),
            ChannelData {
                info,
                badges,
                third_party_emotes,
            },
        );

        Ok(())
    }
}
