use twitch_irc::message::RGBColor;

const MIN_CONTRAST: f64 = 4f64;
const ROUGHNESS: u8 = 3;
const DEFAULT_USER_COLOR: RGBColor = RGBColor {
    r: 70,
    g: 70,
    b: 70,
};
// for now even if user uses a custom background, the overall color is dark,
// ... no white theme
// otherwise this could be a problem
const BACKGROUND_COLOR: RGBColor = RGBColor {
    r: 32,
    g: 32,
    b: 32,
};

fn get_luminance(c: RGBColor) -> f64 {
    0.2126 * (c.r as f64 / 255.0) + 0.7152 * (c.g as f64 / 255.0) + 0.0722 * (c.b as f64 / 255.0)
}

fn get_contrast(c1: RGBColor, c2: RGBColor) -> f64 {
    let luminance1 = get_luminance(c1);
    let luminance2 = get_luminance(c2);

    let (l1, l2) = if luminance1 > luminance2 {
        (luminance1, luminance2)
    } else {
        (luminance2, luminance1)
    };

    (l1 + 0.05) / (l2 + 0.05)
}

fn find_fitting_color(fg: RGBColor, bg: RGBColor) -> RGBColor {
    let mut new_fg = fg;

    while get_contrast(new_fg, bg) < MIN_CONTRAST {
        new_fg.r = new_fg.r.saturating_add(ROUGHNESS);
        new_fg.g = new_fg.g.saturating_add(ROUGHNESS);
        new_fg.b = new_fg.b.saturating_add(ROUGHNESS);
    }

    new_fg
}

pub fn get_color_from_opt(c: Option<RGBColor>) -> String {
    let fg_col = c.unwrap_or(DEFAULT_USER_COLOR);
    find_fitting_color(fg_col, BACKGROUND_COLOR).to_string()
}
