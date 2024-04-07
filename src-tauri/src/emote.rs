// use std::collections::HashMap;

// type EmoteId = String;

// #[derive(Debug, Clone, serde::Deserialize)]
// enum EmoteFormat {
//     Static,
//     Animated,
// }

// #[derive(Debug, Clone, serde::Deserialize)]
// pub enum EmoteKind {
//     NativeGlobal(EmoteId, EmoteFormat),
//     NativeChannelSub(EmoteId, EmoteFormat),
//     NativeChannelFol(EmoteId, EmoteFormat),
//     BttvGlobal(EmoteId, EmoteFormat),
//     BttvChannel(EmoteId, EmoteFormat),
//     FfzPublic(EmoteId, EmoteFormat),
//     FfzGlobal(EmoteId, EmoteFormat),
//     SevenTvPublic(EmoteId, EmoteFormat),
//     SevenTvGlobal(EmoteId, EmoteFormat),
// }

// pub enum EmoteSize {
//     OneX,
//     TwoX,
//     ThreeX,
// }

// // impl EmoteKind {
// //     fn to_url(&self) -> String {
// //         match self {
// //             NativeGlobal(id, format) => format!(""),
// //             _ => unimplemented!(),
// //         }
// //     }
// // }

// // native emotes have all those things with dark versions, lightversions, etc. – im scraping that, at least for now
// // also emote has an animated version, that will always be used
// #[derive(Debug, Clone, serde::Deserialize)]
// pub struct EmoteInfo {
//     url_base: String,
//     kind: EmoteKind,
// }

// #[derive(Debug, Clone, serde::Deserialize, Default)]
// pub struct EmoteRepertoire {
//     native_global: HashMap<String, EmoteInfo>,
//     native_channel_sub: HashMap<String, EmoteInfo>,
//     native_channel_fol: HashMap<String, EmoteInfo>,
//     bttv_global: HashMap<String, EmoteInfo>,
//     bttv_channel: HashMap<String, EmoteInfo>,
//     ffz_public: HashMap<String, EmoteInfo>,
//     ffz_global: HashMap<String, EmoteInfo>,
//     seven_tv_public: HashMap<String, EmoteInfo>,
//     seven_tv_global: HashMap<String, EmoteInfo>,
// }

use twitch_irc::message::PrivmsgMessage;

pub trait InjectNativeEmotes {
    fn inject_native_emotes(&self, privmsg: &PrivmsgMessage) -> Self;
}

impl InjectNativeEmotes for String {
    fn inject_native_emotes(&self, privmsg: &PrivmsgMessage) -> Self {
        let mut out = self.clone();

        for emote in &privmsg.emotes {
            out = out.replace(
                &emote.code,
                &format!(
                    "<img class=\"emote\" src=\"https://static-cdn.jtvnw.net/emoticons/v2/{}/default/dark/3.0\" />",
                    emote.id
                ),
            );
        }

        out
    }
}
