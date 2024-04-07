pub async fn get_all_3rd_party_channel_emotes(
    channel_name: &str,
) -> anyhow::Result<HashMap<String, String>> {
    let res = Client::new()
        .get(&format!(
            // order actually matters here, as the emotes in the response
            // will be grouped by the providers in the order specified in the url

            // so it is here ffz -> bttv -> 7tv
            // then when we iterate through it we get 7tv -> bttv -> ffz
            // which is the actual desired order
            "https://emotes.adamcy.pl/v1/channel/{channel_name}/emotes/ffz.bttv.7tv"
        ))
        .send()
        .await?
        .json::<Res>()
        .await?;

    let mut out = HashMap::new();

    for emote in &res {
        out.insert(emote.code.clone(), emote.urls[2].url.clone());
    }

    Ok(out)
}

use std::collections::HashMap;

use reqwest::Client;
use serde::Deserialize;
use serde::Serialize;

pub type Res = Vec<AdamcyEmoteInfo>;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdamcyEmoteInfo {
    // 0: Twitch, 1: 7TV, 2: BetterTTV, 3: FrankerFaceZ
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
