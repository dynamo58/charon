export interface Backdrop {
  // `property` contains the `background: ...`
  // property that the backdrop is supposed to have
  property: string,
}

export enum Platform {
  YouTube = "YouTube",
  Twitch = "Twitch",
  Kick = "Kick"
}

export namespace Platform {
  export function toIframeUrl(pl: Platform, identifier: string) {
    switch (pl) {
      case Platform.Twitch:
        return `https://www.twitch.tv/embed/${identifier}/chat?parent=localhost&darkpopout`;
      case Platform.Kick:
        return `https://kick.com/${identifier}/chatroom`;
      case Platform.YouTube:
        return `https://www.youtube.com/live_chat?v=${identifier}&amp;embed_domain=localhost`
    }
  }
}


// i.e. one tab in the app
export interface Tab {
  // what the channel is labeled at the top of the app
  label: string,
  // which website the channel corresponds to
  platform: Platform,
  // for twitch/kick streams this would be the channel name
  // for youtube this would be a the URL `v` param
  ident: string,
  // unique identifier for the tab
  uuid: string,
}

export interface Config {
  tabs: Tab[],
  font_ui: string,
  font_chat: string,
  font_scale: number,
  backdrop: Backdrop,
}

export enum PayloadKind {
  Privmsg,
  Usernotice,
  Sysmsg
}

export interface IBadgeInfo {
  title: string,
  url_3x: string,
}

export interface IPrivmgPayload {
  sender_nick: string,
  color: string,
  message: string,
  is_first_message: boolean,
  badges: IBadgeInfo[],
}

export interface IUsernoticePayload {
  sender_nick: string,
  color: string,
  message: string,
  event_name: string,
  system_message: string,
  badges: IBadgeInfo[],
}

export interface IPreferences {
  font: string,
  fontScale: number,
  backdrop: Backdrop,
}

export interface Theme {
  colors: {
    fgMain: string;
    fgAlt: string;

    bgMain: string;
    bgSec: string;
    bgTern: string;

    accent1: string;
    accent2: string;

    border: string;
  };

  fontSizes: {
    small: string;
  };

  fonts: {
    chat: string;
    ui: string;
    scale: number
  };

  backdrop: Backdrop,
}

export enum Provider {
  Native,
  SevenTv,
  BTTV,
  FFZ,
}

export interface Emote {
  code: string,
  provider: Provider,
  url_3x: string,
}

