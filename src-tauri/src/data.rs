use std::collections::HashMap;

use anyhow::Context;
use tracing::warn;
use twitch_api::{helix::channels::ChannelInformation, twitch_oauth2::UserToken, HelixClient};

use crate::{
    apis::{
        adamcy::get_all_3rd_party_channel_emotes,
        helix::{get_channel_badges_from_id, get_global_badges},
    },
    badge::{BadgeInfo, NativeBadgeSet},
    config::Config,
    emote::Emote,
};

#[derive(Debug, Clone, serde::Deserialize)]
pub struct ChannelData {
    pub info: ChannelInformation,
    pub badges: NativeBadgeSet,
    pub third_party_emotes: Vec<Emote>,
}

#[derive(Debug, Clone, serde::Deserialize, Default)]
pub struct GlobalData {
    pub native_badges: NativeBadgeSet,
}

#[derive(Debug, Clone, serde::Deserialize, Default)]
pub struct Dataset {
    /// channel-specific data
    pub channel: HashMap<String, ChannelData>,
    /// global data
    pub global: GlobalData,
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

        result.global.native_badges = get_global_badges(auth).await?;

        Ok(result)
    }

    pub fn remove_channel(&mut self, channel_name: String) {
        self.channel.remove(&channel_name);
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
            .context("oopsie") //#
            .unwrap();
        let badges = get_channel_badges_from_id(info.broadcaster_id.to_string(), &auth)
            .await
            .unwrap(); //#
        let third_party_emotes = get_all_3rd_party_channel_emotes(info.broadcaster_login.as_str())
            .await
            .unwrap(); //#

        self.channel.insert(
            channel_name.clone(),
            ChannelData {
                info,
                badges,
                third_party_emotes,
            },
        );

        Ok(())
    }

    /// returns `None` if dataset doesn't have the specified channel for some reason
    pub fn query_emote_from_substr(&self, channel_login: &str, s: &str) -> Option<Vec<Emote>> {
        // TODO: global emotes
        // also then investigate not having to clone the emoes

        if let None = self.channel.get(channel_login) {
            return None;
        }

        let mut emotes = self
            .channel
            .get(channel_login)
            .unwrap()
            .third_party_emotes
            .iter()
            .filter(|e| e.code.contains(s))
            .cloned()
            .collect::<Vec<Emote>>();

        emotes.sort();
        Some(emotes)
    }

    pub fn get_channel_user_native_badges(
        &self,
        channel_login: &str,
        badges_str: &str,
    ) -> Vec<BadgeInfo> {
        if badges_str.len() == 0 || self.channel.get(channel_login).is_none() {
            return vec![];
        }

        let mut sender_badges = vec![];

        // well this is ugly
        let badge_data = self.channel.get(channel_login).unwrap(); //s
        for b in badges_str.split(',').collect::<Vec<&str>>() {
            let chunks = b.split('/').collect::<Vec<&str>>();

            let set_id = chunks[0];
            let badge_id = chunks[1];

            if let Some(set) = badge_data.badges.get(set_id) {
                if let Some(badge) = set.get(badge_id) {
                    sender_badges.push(badge.clone());
                } else {
                    warn!(
                        "Badge not found; channel: {}, set id: {}, badge id: {}",
                        channel_login, set_id, badge_id
                    );
                }
            } else if let Some(set) = self.global.native_badges.get(set_id) {
                if let Some(badge) = set.get(badge_id) {
                    sender_badges.push(badge.clone());
                } else {
                    warn!(
                        "Badge not found; channel: {}, set id: {}, badge id: {}",
                        channel_login, set_id, badge_id
                    );
                }
            }
        }

        sender_badges
    }
}
