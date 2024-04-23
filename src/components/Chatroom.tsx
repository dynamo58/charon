import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";
import {
  Emote,
  IPrivmgPayload,
  IUsernoticePayload,
  PayloadKind,
  Platform,
  Tab,
} from "../types";
import { listen } from "@tauri-apps/api/event";
import { css } from "solid-styled";
import { MAX_LINE_COUNT_PER_CHAT } from "../constants";
import Privmsg from "./messages/Privmsg";
import Usernotice from "./messages/Usernotice";
import { invoke } from "@tauri-apps/api";
import { useGlobalContext } from "../store";
import Sysmsg, { ISysmsgPayload } from "./messages/Sysmsg";
import EmoteHinter from "./EmoteHinter";

interface IChatroomProps {
  isActive: boolean;
  channel: Tab;
}

interface IMessageWrapper {
  kind: PayloadKind;
  data: IPrivmgPayload | IUsernoticePayload | ISysmsgPayload;
}

const Chatroom = (props: IChatroomProps) => {
  const { theme } = useGlobalContext();

  let divRef: HTMLDivElement;
  let [messages, setMessages] = createSignal<IMessageWrapper[]>([]);
  let lineCount = 0;

  //                 this comma is very important
  //                 due to .tsx syntax error issues
  const handlePayload = <T,>(event: any, kind: PayloadKind) => {
    let msg = {
      kind: kind,
      data: event.payload as T,
    } as IMessageWrapper;

    setMessages((other_msgs) => [...other_msgs, msg]);

    if (lineCount >= MAX_LINE_COUNT_PER_CHAT) {
      setMessages((msgs) => msgs.slice(1));
    } else {
      lineCount++;
    }

    divRef.scrollTop = divRef.scrollHeight;
  };

  createEffect(() => {
    if (props.isActive) divRef.scrollTop = divRef.scrollHeight;
  });

  onMount(async () => {
    await listen(`privmsg__${props.channel.ident}`, (event: any) => {
      handlePayload<IPrivmgPayload>(event, PayloadKind.Privmsg);
    });
    await listen(`usernotice__${props.channel.ident}`, (event: any) => {
      handlePayload<IUsernoticePayload>(event, PayloadKind.Usernotice);
    });
    await listen(`sysmsg__${props.channel.ident}`, (event: any) => {
      handlePayload<ISysmsgPayload>(event, PayloadKind.Sysmsg);
    });

    if (props.channel.platform === Platform.Twitch) {
      await invoke("get_recent_messages", {
        channelName: props.channel.ident,
      });
    }

    window.addEventListener("scrollChat", () => {
      divRef.scrollTop = divRef.scrollHeight;
    });
  });

  css`
    .chatroom {
      padding-left: 0.3em;
      padding-right: 0.3em;
      display: ${props.isActive ? "block" : "none"};
      background-color: ${theme().colors.bgMain};
      overflow-y: overlay;
      flex-grow: 1;
      overflow-wrap: break-word;
      overflow-x: hidden;
      position: relative;
      background: ${theme().backdrop.property};
      background-position: bottom !important;
      background-repeat: no-repeat !important;
    }
    .chatroom .emote {
      height: 2em !important;
      display: inline-block;
    }
  `;

  const [showingEmoteHints, setShowingEmoteHints] =
    createSignal<boolean>(false);
  const [hintedEmotes, setHintedEmotes] = createSignal<Emote[]>([]);

  window.addEventListener("lookingForEmote", ((evt: CustomEvent<string>) => {
    if (!props.isActive) return;

    invoke("query_emotes", {
      channelLogin: props.channel.ident,
      s: evt.detail,
    }).then((res) => {
      let emotes = JSON.parse(res as string) as Emote[];
      setHintedEmotes(emotes);
      setShowingEmoteHints(true);
      window.dispatchEvent(new Event("scrollChat"));
    });
  }) as EventListener);

  window.addEventListener("closeEmoteHinter", () => {
    setShowingEmoteHints(false);
    setHintedEmotes([]);
  });

  return (
    <>
      <div class="chatroom" ref={divRef!}>
        <For each={messages()}>
          {(item, _) => {
            return (
              <Switch>
                <Match when={item.kind === PayloadKind.Privmsg}>
                  <Privmsg {...(item.data as IPrivmgPayload)} />
                </Match>
                <Match when={item.kind === PayloadKind.Usernotice}>
                  <Usernotice {...(item.data as IUsernoticePayload)} />
                </Match>
                <Match when={item.kind === PayloadKind.Sysmsg}>
                  <Sysmsg {...(item.data as ISysmsgPayload)} />
                </Match>
              </Switch>
            );
          }}
        </For>
        <Show when={showingEmoteHints()}>
          <EmoteHinter emotes={hintedEmotes()} />
        </Show>
      </div>
    </>
  );
};

export default Chatroom;
