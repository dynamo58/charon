// as a matter of fact we do use `twitch_api` for the helix api,
// thing is that some endpoints are just not implemented...
// what can you do

use std::collections::HashMap;

use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;

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

use twitch_api::twitch_oauth2::TwitchToken;
use twitch_api::twitch_oauth2::UserToken;

use crate::badge::{BadgeInfo, BadgeSet};

use super::ffz;

pub async fn get_channel_badges_from_id(
    channel_id: String,
    auth: &UserToken,
) -> anyhow::Result<BadgeSet> {
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

    let mut badge_set = BadgeSet(HashMap::new());

    for set_of_badges in &res.data {
        let set_id = set_of_badges.set_id.to_string();
        let mut badges = HashMap::new();

        for v in &set_of_badges.versions {
            let badge_id = v.id.to_string();
            let image_url_base = v
                .image_url_1x
                .get(..v.image_url_1x.len() - 1)
                .unwrap()
                .to_string();

            let title = v.title.to_string();

            badges.insert(
                badge_id,
                BadgeInfo {
                    title,
                    image_url_base,
                },
            );
        }

        badge_set.0.insert(set_id, badges);
    }

    let ffz_room = ffz::get_room(channel_id).await?;

    if let Some(mod_badge_url) = ffz_room.room.moderator_badge {
        let base_url = mod_badge_url
            .get(..mod_badge_url.len() - 1)
            .unwrap()
            .to_string();

        let map = HashMap::from([(
            "1".into(),
            BadgeInfo {
                title: "Moderator".into(),
                image_url_base: base_url,
            },
        )]);

        badge_set.0.insert("moderator".into(), map);
    }

    if let Some(vip_badges) = ffz_room.room.vip_badge {
        let base_url = vip_badges
            .n1
            .get(..vip_badges.n1.len() - 1)
            .unwrap()
            .to_string();

        let map = HashMap::from([(
            "1".into(),
            BadgeInfo {
                title: "VIP".into(),
                image_url_base: base_url,
            },
        )]);

        badge_set.0.insert("vip".into(), map);
    }

    Ok(badge_set)
}

pub async fn get_global_badges(auth: &UserToken) -> anyhow::Result<BadgeSet> {
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

    let mut badge_set = BadgeSet(HashMap::new());

    for set_of_badges in &res.data {
        let set_id = set_of_badges.set_id.to_string();
        let mut badges = HashMap::new();

        for v in &set_of_badges.versions {
            let badge_id = v.id.to_string();
            let image_url_base = v
                .image_url_1x
                .get(..v.image_url_1x.len() - 1)
                .unwrap()
                .to_string();

            let title = v.title.to_string();

            badges.insert(
                badge_id,
                BadgeInfo {
                    title,
                    image_url_base,
                },
            );
        }

        badge_set.0.insert(set_id, badges);
    }

    Ok(badge_set)
}
