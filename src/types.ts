export interface IRecievedMessage {
  sender_nick: string,
  color: string,
  message: string,
}

export interface Config {
  channels: string[],
}
