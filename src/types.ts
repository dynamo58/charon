export interface Config {
  channels: string[],
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
