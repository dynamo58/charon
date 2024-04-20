use std::cmp::Ordering;

use serde::{Deserialize, Serialize};

use crate::shared::{levenshtein_distance, Levenshtein};

#[derive(Debug, Clone, Copy, Serialize, PartialEq, PartialOrd, Eq, Ord, Deserialize)]
pub enum Provider {
    /// emote comes from twitch itself
    Native,
    /// emote comes from 7TV
    SevenTv,
    /// emote comes from BTTV
    BTTV,
    /// emote comes from FFZ
    FFZ,
}

#[derive(Debug, Clone, Serialize, Eq, PartialEq, Ord, Deserialize)]
pub struct Emote {
    /// the string used in chat when typing the emote
    pub code: String,
    pub provider: Provider,
    /// a URL to the emote's 3x size
    /// for native, bttv and ffz this would be 112x112
    /// and for 7tv 128x128, cuz they just have to be special
    pub url_3x: String,
}

impl PartialOrd for Emote {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        if self.code != other.code {
            return Some(self.code.cmp(&other.code));
        }

        Some(self.provider.cmp(&other.provider))
    }
}

impl Levenshtein for Vec<Emote> {
    fn sort_by_levenshtein(&mut self, key: &str) {
        self.sort_by(|a, b| {
            let dist_a = levenshtein_distance(&a.code, &key);
            let dist_b = levenshtein_distance(&b.code, &key);
            dist_a.cmp(&dist_b)
        });
    }
}
