pub async fn get_all_3rd_party_channel_emotes(channel_name: &str) -> anyhow::Result<Vec<Emote>> {
    dbg!(channel_name);
    let res = Client::new()
        .get(&format!(
            "https://emotes.adamcy.pl/v1/channel/{channel_name}/emotes/ffz.bttv.7tv"
        ))
        .send()
        .await?
        .json::<Res>()
        .await?;

    let out = res
        .iter()
        .map(|e| Emote {
            code: e.code.to_owned(),
            provider: e.get_provider(),
            url_3x: e.urls[2].url.to_owned(),
        })
        .collect::<Vec<Emote>>();

    Ok(out)
}

use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;

use crate::emote::Emote;
use crate::emote::Provider;

pub type Res = Vec<AdamcyEmoteInfo>;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdamcyEmoteInfo {
    // 0: Twitch, 1: 7TV, 2: BetterTTV, 3: FrankerFaceZ
    pub provider: i64,
    pub code: String,
    pub urls: Vec<Url>,
}

impl AdamcyEmoteInfo {
    fn get_provider(&self) -> Provider {
        match self.provider {
            1 => Provider::SevenTv,
            2 => Provider::BTTV,
            3 => Provider::FFZ,
            _ => Provider::Native,
        }
    }
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Url {
    pub size: String,
    pub url: String,
}
