export interface Config {
  channels: string[],
}

export enum IPayloadKind {
  Privmsg,
  Usernotice,
}

export interface IPrivmgPayload {
  sender_nick: string,
  color: string,
  message: string,
  is_first_message: boolean,
}

export interface IUsernoticePayload {
  sender_nick: string,
  color: string,
  message: string,
  event_name: string,
  system_message: string,
}
