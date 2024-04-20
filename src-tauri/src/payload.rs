use crate::{badge::BadgeInfo, data::Dataset};
use twitch_irc::message::{
    ClearChatAction::*, ClearChatMessage, PrivmsgMessage, ReplyToMessage, UserNoticeMessage,
};

use crate::color::get_color_from_opt;

#[derive(Clone, serde::Serialize)]
pub struct PrivmsgPayload {
    pub sender_nick: String,
    pub color: String,
    pub message: String,
    pub is_first_message: bool,
    pub badges: Vec<BadgeInfo>,
}

impl PrivmsgPayload {
    pub fn from_privmsg(privmsg: PrivmsgMessage, dataset: &Dataset) -> PrivmsgPayload {
        let sender_badges = match privmsg.source.tags.0.get("badges") {
            Some(&Some(ref badges_str)) => {
                dataset.get_channel_user_native_badges(&privmsg.channel_login, badges_str)
            }
            _ => vec![],
        };

        PrivmsgPayload {
            sender_nick: privmsg.sender.name.clone(),
            message: inject_message(privmsg.message_text.clone(), &privmsg, dataset),
            color: get_color_from_opt(privmsg.name_color),
            badges: sender_badges,
            is_first_message: privmsg.source.tags.0.get("first-msg")
                == Some(&Some("1".to_string())),
        }
    }
}

#[derive(Clone, serde::Serialize)]
pub struct UsernoticePayload {
    pub sender_nick: String,
    pub color: String,
    pub message: String,
    pub event_name: String,
    pub system_message: String,
    pub badges: Vec<BadgeInfo>,
}

impl UsernoticePayload {
    pub fn from_usernotice(usrnotice: UserNoticeMessage, _dataset: &Dataset) -> Self {
        // let channel_badges = &dataset
        //     .channel_data
        //     .get(&usrnotice.channel_login)
        //     .unwrap()
        //     .badges
        //     .0;

        // let mut sender_badges = vec![];

        // if let Some(&Some(ref badges_str)) = usrnotice.source.tags.0.get("badges") {
        //     if badges_str.len() > 0 {
        //         for b in badges_str.split(',').collect::<Vec<&str>>() {
        //             let chunks = b.split('/').collect::<Vec<&str>>();

        //             let set_id = chunks[0];
        //             let badge_id = chunks[1];

        //             if let Some(set) = channel_badges.get(set_id) {
        //                 sender_badges.push(set.get(badge_id).unwrap().clone());
        //             } else if let Some(set) = dataset.global_badges.0.get(set_id) {
        //                 sender_badges.push(set.get(badge_id).unwrap().clone());
        //             }
        //         }
        //     }
        // }

        Self {
            badges: vec![],
            sender_nick: usrnotice.sender.name,
            message: usrnotice.message_text.unwrap_or_default(),
            color: get_color_from_opt(usrnotice.name_color),
            system_message: usrnotice.system_message,
            event_name: usrnotice.event_id,
        }
    }
}

fn inject_message(s: String, privmsg: &PrivmsgMessage, data: &Dataset) -> String {
    let mut third_party_emotes = &vec![];

    if let Some(channel_data) = &data.channel.get(privmsg.channel_login()) {
        third_party_emotes = &channel_data.third_party_emotes;
    }

    let mut out = String::new();

    for word in s.split(' ').collect::<Vec<&str>>() {
        // decide if word is a link

        //     for these purposes a word is a string iff it has a dot somewhere
        //     in the middle and at least one of its sides is not purely numeric
        // TODO: fix; this false-triggers on "test...."
        if let Some(dot_pos) = word.chars().position(|c| c == '.') {
            if dot_pos > 0
                && dot_pos < word.len() - 1
                && (word[0..dot_pos].parse::<isize>().is_err()
                    || word[dot_pos..].parse::<isize>().is_err())
            {
                out.push_str(&format!(
                    "<a class='inline-link' target='_blank' href='{word}'>{word}</a>"
                ));
                continue;
            }
        }

        // decide if it is a native emote
        if let Some(emote_idx) = privmsg.emotes.iter().position(|e| e.code == word) {
            out.push_str(&format!(
                "<img class='emote' src='https://static-cdn.jtvnw.net/emoticons/v2/{}/default/dark/3.0' />",
                privmsg.emotes[emote_idx].id
            ));
            continue;
        }

        if let Some((_, em)) = third_party_emotes
            .iter()
            .enumerate()
            .find(|(_, &ref e)| e.code == word)
        {
            out.push_str(&format!("<img class='emote' src='{}' />", em.url_3x));
            continue;
        }

        out.push_str(&format!("{word} "));
    }

    out
}

#[derive(Clone, serde::Serialize)]
pub struct SystemMessage {
    pub message: String,
}

impl SystemMessage {
    pub fn from_clearchatmsg(clrchat: ClearChatMessage) -> Self {
        match clrchat.action {
            ChatCleared => Self {
                message: String::from("The chat has been cleared."),
            },
            UserBanned {
                user_login,
                user_id: _,
            } => Self {
                message: format!("{user_login} has been permanently banned."),
            },
            UserTimedOut {
                user_login,
                user_id: _,
                timeout_length,
            } => Self {
                message: format!(
                    "{user_login} has been timed out for {}s.",
                    timeout_length.as_secs() // TODO: make a function for formattign thyme
                ),
            },
        }
    }

    pub fn from<T: ToString>(s: T) -> Self {
        Self {
            message: s.to_string(),
        }
    }
}
