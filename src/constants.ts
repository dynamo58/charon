export const STATIC_FONTS = ["Arial"]

export const MAX_LINE_COUNT_PER_CHAT = 100;

const SCOPES = [
  "channel:manage:moderators",
  "channel:read:polls",
  "channel:manage:polls",
  "channel:read:predictions",
  "channel:manage:predictions",
  "channel:manage:raids",
  "channel:read:redemptions",
  "channel:manage:redemptions",
  "channel:read:vips",
  "channel:manage:vips",
  "moderation:read",
  "moderator:manage:announcements",
  "moderator:manage:automod",
  "moderator:manage:banned_users",
  "moderator:manage:chat_messages",
  "moderator:read:chat_settings",
  "moderator:manage:chat_settings",
  "moderator:read:chatters",
  "moderator:manage:unban_requests",
  "user:manage:chat_color",
  "user:manage:whispers",
  "chat:edit",
  "chat:read",
];

const TWITCH_AUTH_REDIRECT_URI = "http://localhost:32995";

export const TWITCH_AUTH_URL = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=fz8cjqkn05ab6kiii0jqbhbgc08kv6&redirect_uri=${TWITCH_AUTH_REDIRECT_URI}&scope=${encodeURIComponent(SCOPES.join(' '))}`;
