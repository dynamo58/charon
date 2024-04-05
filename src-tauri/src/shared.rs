use tokio::sync::mpsc::UnboundedReceiver;
use twitch_irc::login::StaticLoginCredentials;
use twitch_irc::message::ServerMessage;
use twitch_irc::transport::tcp::{TCPTransport, TLS};
use twitch_irc::TwitchIRCClient;
use twitch_irc::{ClientConfig, SecureTCPTransport};

use twitch_api::helix::HelixClient;
use twitch_api::twitch_oauth2::{AccessToken, UserToken};

// use twitch_api::helix::predictions::end_prediction::EndPrediction;
// use twitch_api::helix::predictions::{
//     create_prediction, end_prediction, get_predictions, Prediction,
// };
// use twitch_api::twitch_oauth2::TwitchToken;
// use twitch_api::types::{PredictionIdRef, PredictionStatus, UserId};

pub type Client = TwitchIRCClient<TCPTransport<TLS>, StaticLoginCredentials>;
pub type TIRCCredentials = TwitchIRCClient<SecureTCPTransport, StaticLoginCredentials>;

pub type MessageReceiver = UnboundedReceiver<ServerMessage>;

use tauri::{AppHandle, Manager};

use crate::data;
use crate::payload;

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

// struct TwitchAuth {
//     username: String,
//     client_id: String,
//     user_id: String,
//     oauth: String,
// }

pub struct Connections<'a> {
    /// the actual client that is used to send messages
    pub client: Client,
    /// an anonymous client that is used to receive messages
    /// this is for:
    /// - making sure own messages are received
    /// - mitigate getting shadow banned by twitch
    pub anon_client: Client,
    /// the helix client, used to communicate with the Twitch Helix API
    pub helix: HelixClient<'a, reqwest::Client>,
    // i dont like seeing this here, but thats the way
    // the way twitch_api is designed...
    /// used to authentificate helix client requests
    pub helix_user_token: UserToken,
}

impl Connections<'_> {
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
                client,
                anon_client,
                helix,
                helix_user_token: token,
            },
        ))
    }
}
