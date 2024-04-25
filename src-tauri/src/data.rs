use std::collections::HashMap;

use anyhow::Context;
use tauri::AppHandle;
use tracing::warn;
use twitch_api::{helix::channels::ChannelInformation, twitch_oauth2::UserToken, HelixClient};

use crate::{
    apis::{
        adamcy::get_all_3rd_party_channel_emotes,
        helix::{get_channel_badges_from_id, get_global_badges},
    },
    badge::{BadgeInfo, NativeBadgeSet},
    config::Config,
    emoji::EMOJIS,
    emote::{Emote, Provider},
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

#[derive(Debug, Clone, Default)]
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
        handle: &AppHandle,
    ) -> anyhow::Result<Self> {
        let mut result = Self::default();

        for tab in &config.tabs {
            result
                .add_channel(auth, helix_client, &tab.ident, handle)
                .await;
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
        channel_name: &str,
        handle: &AppHandle,
    ) {
        let info = helix_client
            .get_channel_from_login(channel_name, auth)
            .await;

        if let Err(_) = info {
            crate::commands::report(
                &handle,
                channel_name,
                "⚠️ Fatal: Twitch connection failed".into(),
            );
            return;
        }

        let info = info.unwrap();

        if let None = info {
            crate::commands::report(
                &handle,
                channel_name,
                "⚠️ Fatal: channel does not exist".into(),
            );
            return;
        }

        let info = info.unwrap();

        let badges = get_channel_badges_from_id(info.broadcaster_id.to_string(), &auth).await;

        if let Err(_) = badges {
            crate::commands::report(
                &handle,
                channel_name,
                "⚠️ Warning: failed loading native badges for channel".into(),
            );
        }

        let badges = badges.unwrap();

        let third_party_emotes =
            get_all_3rd_party_channel_emotes(info.broadcaster_login.as_str()).await;

        if let Err(_) = third_party_emotes {
            crate::commands::report(
                &handle,
                channel_name,
                "⚠️ Warning: failed loading 3rd party emotes from Adamcy API".into(),
            );
        }

        let third_party_emotes = third_party_emotes.unwrap_or_default();

        self.channel.insert(
            channel_name.to_string(),
            ChannelData {
                info,
                badges,
                third_party_emotes,
            },
        );
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

        for e in EMOJIS
            .iter()
            .filter(|e| e.ident.contains(s))
            .map(|e| Emote {
                code: e.emoji.to_string(),
                provider: Provider::Native,
                url_3x: "".to_string(),
            })
        {
            emotes.push(e.clone());
        }

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
