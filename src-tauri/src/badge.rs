use std::collections::HashMap;

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct BadgeInfo {
    /// supposed name of theb badge
    pub title: String,
    /// usually 72x72
    pub url_3x: String,
}

pub type NativeBadgeSet = HashMap<String, HashMap<String, BadgeInfo>>;
