// as a matter of fact we do use `twitch_api` for the helix api,
// thing is that some endpoints are just not implemented...
// what can you do

use std::collections::HashMap;

use anyhow::Context;
use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;

use twitch_api::twitch_oauth2::TwitchToken;
use twitch_api::twitch_oauth2::UserToken;

use crate::badge::{BadgeInfo, NativeBadgeSet};

use super::ffz;

pub async fn get_channel_badges_from_id(
    channel_id: String,
    auth: &UserToken,
) -> anyhow::Result<NativeBadgeSet> {
    let res = Client::new()
        .get(&format!(
            "https://api.twitch.tv/helix/chat/badges?broadcaster_id={channel_id}"
        ))
        .header("Client-ID", auth.client_id().to_string())
        .header(
            "Authorization",
            format!("Bearer {}", auth.access_token.secret()),
        )
        .send()
        .await?
        .json::<BadgesRes>()
        .await?;

    let mut badge_set = HashMap::new();

    for set_of_badges in &res.data {
        let set_id = set_of_badges.set_id.to_string();
        let mut badges = HashMap::new();

        for v in &set_of_badges.versions {
            badges.insert(
                v.id.to_string(),
                BadgeInfo {
                    title: v.title.to_owned(),
                    url_3x: v.image_url_4x.to_owned(),
                },
            );
        }

        badge_set.insert(set_id, badges);
    }

    let ffz_room = ffz::get_room(channel_id).await.context("buh")?; //#

    if let Some(mod_badge_url) = ffz_room.room.moderator_badge {
        badge_set.insert(
            "moderator".into(),
            HashMap::from([(
                "1".into(),
                BadgeInfo {
                    title: "Moderator".into(),
                    url_3x: mod_badge_url,
                },
            )]),
        );
    }

    if let Some(vip_badges) = &ffz_room.room.vip_badge {
        if let Some(four_x_badge) = &vip_badges.n4 {
            badge_set.insert(
                "vip".into(),
                HashMap::from([(
                    "1".into(),
                    BadgeInfo {
                        title: "VIP".into(),
                        url_3x: four_x_badge.to_string(),
                    },
                )]),
            );
        }
    }

    Ok(badge_set)
}

pub async fn get_global_badges(auth: &UserToken) -> anyhow::Result<NativeBadgeSet> {
    let res = Client::new()
        .get("https://api.twitch.tv/helix/chat/badges/global")
        .header("Client-ID", auth.client_id().to_string())
        .header(
            "Authorization",
            format!("Bearer {}", auth.access_token.secret()),
        )
        .send()
        .await?
        .json::<BadgesRes>()
        .await?;

    let mut badge_set = HashMap::new();

    for set_of_badges in &res.data {
        let set_id = set_of_badges.set_id.to_string();
        let mut badges = HashMap::new();

        for v in &set_of_badges.versions {
            badges.insert(
                v.id.to_string(),
                BadgeInfo {
                    title: v.title.to_owned(),
                    url_3x: v.image_url_4x.to_owned(),
                },
            );
        }

        badge_set.insert(set_id, badges);
    }

    Ok(badge_set)
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalEmotesRes {
    pub data: Vec<Daumm>,
    pub template: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Daumm {
    pub id: String,
    pub name: String,
    pub images: Images,
    pub format: Vec<Format>,
    pub scale: Vec<Scale>,
    #[serde(rename = "theme_mode")]
    pub theme_mode: Vec<ThemeMode>,
}

#[derive(PartialEq, Clone, Debug, Deserialize, Serialize)]
pub enum Format {
    Static,
    Animated,
}

#[derive(PartialEq, Clone, Debug, Deserialize, Serialize)]
pub enum ThemeMode {
    Light,
    Dark,
}

#[derive(PartialEq, Clone, Debug, Deserialize, Serialize)]
pub enum Scale {
    #[serde(rename = "1.0")]
    One,
    #[serde(rename = "2.0")]
    Two,
    #[serde(rename = "3.0")]
    Three,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Images {
    #[serde(rename = "url_1x")]
    pub url_1x: String,
    #[serde(rename = "url_2x")]
    pub url_2x: String,
    #[serde(rename = "url_4x")]
    pub url_4x: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BadgesRes {
    pub data: Vec<Daum>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Daum {
    #[serde(rename = "set_id")]
    pub set_id: String,
    pub versions: Vec<Version>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Version {
    pub id: String,
    #[serde(rename = "image_url_1x")]
    pub image_url_1x: String,
    #[serde(rename = "image_url_2x")]
    pub image_url_2x: String,
    #[serde(rename = "image_url_4x")]
    pub image_url_4x: String,
    pub title: String,
    pub description: String,
    #[serde(rename = "click_action")]
    pub click_action: Option<String>,
    #[serde(rename = "click_url")]
    pub click_url: Option<String>,
}
