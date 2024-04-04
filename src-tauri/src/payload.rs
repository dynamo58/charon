use twitch_irc::message::{PrivmsgMessage, UserNoticeMessage};

const DEFAULT_USER_COLOR: &'static str = "#575757";

#[derive(Clone, serde::Serialize)]
pub struct PrivmsgPayload {
    pub sender_nick: String,
    pub color: String,
    pub message: String,
    pub is_first_message: bool,
}

impl PrivmsgPayload {
    pub fn from_privmsg(privmsg: PrivmsgMessage) -> PrivmsgPayload {
        let color = match privmsg.name_color {
            Some(c) => c.to_string(),
            None => DEFAULT_USER_COLOR.to_string(),
        };

        PrivmsgPayload {
            sender_nick: privmsg.sender.name,
            message: privmsg.message_text,
            color,
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
}

impl UsernoticePayload {
    pub fn from_usernotice(usrnotice: UserNoticeMessage) -> Self {
        let color = match usrnotice.name_color {
            Some(c) => c.to_string(),
            None => DEFAULT_USER_COLOR.to_string(),
        };

        Self {
            sender_nick: usrnotice.sender.name,
            message: usrnotice.message_text.unwrap_or_default(),
            color,
            system_message: usrnotice.system_message,
            event_name: usrnotice.event_id,
        }
    }
}
