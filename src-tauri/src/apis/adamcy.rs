pub async fn get_all_channel_emotes(channel_name: String) -> anyhow::Result<Res> {
    Ok(Client::new()
        .get(&format!(
            // 0: Twitch, 1: 7TV, 2: BetterTTV, 3: FrankerFaceZ
            "https://emotes.adamcy.pl/v1/channel/{channel_name}/emotes/all"
        ))
        .send()
        .await?
        .json::<Res>()
        .await?)
}

use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;

pub type Res = Vec<Root>;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Root {
    pub provider: i64,
    pub code: String,
    pub urls: Vec<Url>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Url {
    pub size: String,
    pub url: String,
}
