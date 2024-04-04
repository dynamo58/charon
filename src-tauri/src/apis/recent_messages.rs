use reqwest::Client;

use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;

const LIMIT_PULLED_MESSAGES: usize = 100;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentMessagesRes {
    pub messages: Vec<String>,
    pub error: Value,
    #[serde(rename = "error_code")]
    pub error_code: Value,
}

pub async fn fetch(channel_name: String) -> anyhow::Result<RecentMessagesRes> {
    Ok(Client::new()
        .get(&format!(
            "https://recent-messages.robotty.de/api/v2/recent-messages/{channel_name}?limit={LIMIT_PULLED_MESSAGES}"
        ))
        .send()
        .await?
        .json::<RecentMessagesRes>()
        .await?)
}

pub async fn fetch_raw(channel_name: String) -> anyhow::Result<String> {
    Ok(Client::new()
        .get(&format!(
            "https://recent-messages.robotty.de/api/v2/recent-messages/{channel_name}?limit={LIMIT_PULLED_MESSAGES}"
        ))
        .send()
        .await?
        .text()
        .await?)
}
