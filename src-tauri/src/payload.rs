use twitch_irc::message::{PrivmsgMessage, UserNoticeMessage};

const DEFAULT_USER_COLOR: &'static str = "#575757";

use crate::{badge::BadgeInfo, data::Dataset};

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
        let color = match privmsg.name_color {
            Some(c) => c.to_string(),
            None => DEFAULT_USER_COLOR.to_string(),
        };

        let channel_badges = &dataset
            .channel_data
            .get(&privmsg.channel_login)
            .unwrap()
            .badges
            .0;

        let mut sender_badges = vec![];

        if let Some(&Some(ref badges_str)) = privmsg.source.tags.0.get("badges") {
            if badges_str.len() > 0 {
                for b in badges_str.split(',').collect::<Vec<&str>>() {
                    let chunks = b.split('/').collect::<Vec<&str>>();

                    let set_id = chunks[0];
                    let badge_id = chunks[1];

                    if let Some(set) = channel_badges.get(set_id) {
                        sender_badges.push(set.get(badge_id).unwrap().clone());
                    } else if let Some(set) = dataset.global_badges.0.get(set_id) {
                        sender_badges.push(set.get(badge_id).unwrap().clone());
                    }
                }
            }
        }

        PrivmsgPayload {
            sender_nick: privmsg.sender.name,
            message: privmsg.message_text,
            color,
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
    pub fn from_usernotice(usrnotice: UserNoticeMessage, dataset: &Dataset) -> Self {
        let color = match usrnotice.name_color {
            Some(c) => c.to_string(),
            None => DEFAULT_USER_COLOR.to_string(),
        };

        let channel_badges = &dataset
            .channel_data
            .get(&usrnotice.channel_login)
            .unwrap()
            .badges
            .0;

        let mut sender_badges = vec![];

        if let Some(&Some(ref badges_str)) = usrnotice.source.tags.0.get("badges") {
            if badges_str.len() > 0 {
                for b in badges_str.split(',').collect::<Vec<&str>>() {
                    let chunks = b.split('/').collect::<Vec<&str>>();

                    let set_id = chunks[0];
                    let badge_id = chunks[1];

                    if let Some(set) = channel_badges.get(set_id) {
                        sender_badges.push(set.get(badge_id).unwrap().clone());
                    } else if let Some(set) = dataset.global_badges.0.get(set_id) {
                        sender_badges.push(set.get(badge_id).unwrap().clone());
                    }
                }
            }
        }

        Self {
            badges: sender_badges,
            sender_nick: usrnotice.sender.name,
            message: usrnotice.message_text.unwrap_or_default(),
            color,
            system_message: usrnotice.system_message,
            event_name: usrnotice.event_id,
        }
    }
}
