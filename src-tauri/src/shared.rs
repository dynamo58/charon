use tokio::sync::mpsc::UnboundedReceiver;
use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::message::ServerMessage;
use twitch_irc::transport::tcp::{TCPTransport, TLS};
use twitch_irc::TwitchIRCClient;
use twitch_irc::{ClientConfig, SecureTCPTransport};

use twitch_api::helix::HelixClient;
use twitch_api::twitch_oauth2::{AccessToken, UserToken};

pub type Client = TwitchIRCClient<TCPTransport<TLS>, StaticLoginCredentials>;
pub type TIRCCredentials = TwitchIRCClient<SecureTCPTransport, StaticLoginCredentials>;

pub type MessageReceiver = UnboundedReceiver<ServerMessage>;

use tauri::{AppHandle, Manager};

use crate::data;
use crate::payload;

const TWITCH_APP_ID: &'static str = "fz8cjqkn05ab6kiii0jqbhbgc08kv6";

pub fn handle_received_message(
    handle: &AppHandle,
    message: ServerMessage,
    dataset: &data::Dataset,
) {
    match message {
        ServerMessage::Privmsg(privmsg) => {
            let event_name = format!("privmsg__{}", privmsg.channel_login);
            handle
                .emit_all(
                    &event_name,
                    payload::PrivmsgPayload::from_privmsg(privmsg, dataset),
                )
                .unwrap();
        }
        ServerMessage::UserNotice(usrnotice) => {
            let event_name = format!("usernotice__{}", usrnotice.channel_login);
            handle
                .emit_all(
                    &event_name,
                    payload::UsernoticePayload::from_usernotice(usrnotice, dataset),
                )
                .unwrap();
        }
        _ => {}
    }
}

pub struct TwitchAuthed<'a> {
    pub client: Client,
    pub helix: HelixClient<'a, reqwest::Client>,
    pub helix_user_token: UserToken,
}

pub struct Connections<'a> {
    pub anon_client: Client,
    pub authed: Option<TwitchAuthed<'a>>,
}

impl Connections<'_> {
    #[allow(unused)]
    pub async fn from_env_vars() -> anyhow::Result<(MessageReceiver, Self)> {
        let (recv, anon_client) = TIRCCredentials::new(ClientConfig::default());

        let (_, client) =
            TIRCCredentials::new(ClientConfig::new_simple(StaticLoginCredentials::new(
                std::env::var("TWITCH.USERNAME").unwrap(),
                Some(std::env::var("TWITCH.OAUTH").unwrap()),
            )));

        let helix: HelixClient<reqwest::Client> = HelixClient::default();
        let token =
            UserToken::from_token(&helix, AccessToken::from(std::env::var("TWITCH.OAUTH")?))
                .await?;

        Ok((
            recv,
            Self {
                anon_client,
                authed: Some(TwitchAuthed {
                    client: client,
                    helix: helix,
                    helix_user_token: token,
                }),
            },
        ))
    }

    pub fn default() -> (MessageReceiver, Self) {
        let (recv, anon_client) = TIRCCredentials::new(ClientConfig::default());

        (
            recv,
            Self {
                anon_client,
                authed: None,
            },
        )
    }

    pub async fn with_token(&mut self, access_token: String) -> anyhow::Result<()> {
        let (_, client) = TIRCCredentials::new(ClientConfig::new_simple(
            StaticLoginCredentials::new(TWITCH_APP_ID.to_string(), Some(access_token.clone())),
        ));

        let helix: HelixClient<reqwest::Client> = HelixClient::default();
        let token = UserToken::from_token(&helix, AccessToken::from(access_token)).await?;

        self.authed = Some(TwitchAuthed {
            client,
            helix,
            helix_user_token: token,
        });

        Ok(())
    }
}
