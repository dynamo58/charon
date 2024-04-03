use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::transport::tcp::{TCPTransport, TLS};
use twitch_irc::SecureTCPTransport;
use twitch_irc::TwitchIRCClient;

pub type Client = TwitchIRCClient<TCPTransport<TLS>, StaticLoginCredentials>;
pub type TIRCCredentials = TwitchIRCClient<SecureTCPTransport, StaticLoginCredentials>;
