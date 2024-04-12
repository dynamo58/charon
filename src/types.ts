export interface Config {
  channels: string[],
  font_ui: string,
  font_chat: string,
}

export enum PayloadKind {
  Privmsg,
  Usernotice,
}

export interface IBadgeInfo {
  title: string,
  image_url_base: string,
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
  };
}