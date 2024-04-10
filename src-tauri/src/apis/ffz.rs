use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;

pub async fn get_room(channel_id: String) -> anyhow::Result<FFZRoom> {
    Ok(Client::new()
        .get(&format!(
            "https://api.frankerfacez.com/v1/room/id/{channel_id}"
        ))
        .send()
        .await?
        .json::<FFZRoom>()
        .await?)
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FFZRoom {
    pub room: Room,
    pub sets: Value,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Room {
    #[serde(rename = "_id")]
    pub id: i64,
    #[serde(rename = "twitch_id")]
    pub twitch_id: i64,
    #[serde(rename = "youtube_id")]
    pub youtube_id: Option<i64>,
    #[serde(rename = "id")]
    pub id2: String,
    #[serde(rename = "is_group")]
    pub is_group: bool,
    #[serde(rename = "display_name")]
    pub display_name: String,
    pub set: i64,
    #[serde(rename = "moderator_badge")]
    pub moderator_badge: Option<String>, //null
    #[serde(rename = "vip_badge")]
    pub vip_badge: Option<VipBadge>, // null
    #[serde(rename = "mod_urls")]
    pub mod_urls: Option<ModUrls>,
    #[serde(rename = "user_badges")]
    pub user_badges: Value,
    #[serde(rename = "user_badge_ids")]
    pub user_badge_ids: Value,
    pub css: Value,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VipBadge {
    #[serde(rename = "1")]
    pub n1: Option<String>,
    #[serde(rename = "2")]
    pub n2: Option<String>,
    #[serde(rename = "4")]
    pub n4: Option<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModUrls {
    #[serde(rename = "1")]
    pub n1: Option<String>,
    #[serde(rename = "2")]
    pub n2: Option<String>,
    #[serde(rename = "4")]
    pub n4: Option<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBadges {
    #[serde(rename = "2")]
    pub n2: Vec<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserBadgeIds {
    #[serde(rename = "2")]
    pub n2: Vec<i64>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Sets {
    #[serde(rename = "857530")]
    pub n857530: n857530,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct n857530 {
    pub id: i64,
    #[serde(rename = "_type")]
    pub type_field: i64,
    pub icon: Value,
    pub title: String,
    pub css: Value,
    pub emoticons: Vec<Emoticon>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Emoticon {
    pub id: i64,
    pub name: String,
    pub height: i64,
    pub width: i64,
    pub public: bool,
    pub hidden: bool,
    pub modifier: bool,
    #[serde(rename = "modifier_flags")]
    pub modifier_flags: i64,
    pub offset: Value,
    pub margins: Value,
    pub css: Value,
    pub owner: Owner,
    pub artist: Value,
    pub urls: Urls,
    pub status: i64,
    #[serde(rename = "usage_count")]
    pub usage_count: i64,
    #[serde(rename = "created_at")]
    pub created_at: String,
    #[serde(rename = "last_updated")]
    pub last_updated: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Owner {
    #[serde(rename = "_id")]
    pub id: i64,
    pub name: String,
    #[serde(rename = "display_name")]
    pub display_name: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Urls {
    #[serde(rename = "1")]
    pub n1: String,
    #[serde(rename = "2")]
    pub n2: String,
    #[serde(rename = "4")]
    pub n4: String,
}
