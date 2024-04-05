use std::collections::HashMap;

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
pub struct BadgeInfo {
    pub title: String,
    pub image_url_base: String,
}

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize, Default)]
pub struct BadgeSet(pub HashMap<String, HashMap<String, BadgeInfo>>);
