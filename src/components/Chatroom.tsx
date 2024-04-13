import {
  For,
  Match,
  Switch,
  createEffect,
  createSignal,
  onMount,
} from "solid-js";
import { IPrivmgPayload, IUsernoticePayload, PayloadKind } from "../types";
import { listen } from "@tauri-apps/api/event";
import { css } from "solid-styled";
import { MAX_LINE_COUNT_PER_CHAT } from "../constants";
import Privmsg from "./messages/Privmsg";
import Usernotice from "./messages/Usernotice";
import { invoke } from "@tauri-apps/api";
import { useGlobalContext } from "../store";

interface IChatroomProps {
  isActive: boolean;
  channelName: string;
}

interface IMessageWrapper {
  kind: PayloadKind;
  data: IPrivmgPayload | IUsernoticePayload;
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
    await listen(`privmsg__${props.channelName}`, (event: any) => {
      handlePayload<IPrivmgPayload>(event, PayloadKind.Privmsg);
    });
    await listen(`usernotice__${props.channelName}`, (event: any) => {
      handlePayload<IUsernoticePayload>(event, PayloadKind.Usernotice);
    });

    await invoke("get_recent_messages", {
      channelName: props.channelName,
    });

    window.addEventListener("scrollChat", () => {
      divRef.scrollTop = divRef.scrollHeight;
    });
  });

  css`
    .chatroom {
      width: calc(100vw -10px);
      padding-left: 0.3em;
      padding-right: 0.3em;
      display: ${props.isActive ? "block" : "none"};
      background-color: ${theme().colors.bgSec};
      overflow-y: overlay;
      background-color: ${theme().colors.bgSec};
      flex-grow: 1;
      overflow-wrap: break-word;
      overflow-x: hidden;
    }

    .chatroom .emote {
      height: 2em !important;
      display: inline-block;
    }
  `;

  return (
    <>
      <div class="chatroom" ref={divRef!}>
        <For each={messages()}>
          {(item, _) => {
            return (
              <Switch>
                <Match when={item.kind === PayloadKind.Privmsg}>
                  <Privmsg {...(item.data as IPrivmgPayload)}></Privmsg>
                </Match>
                <Match when={item.kind === PayloadKind.Usernotice}>
                  <Usernotice
                    {...(item.data as IUsernoticePayload)}
                  ></Usernotice>
                </Match>
              </Switch>
            );
          }}
        </For>
      </div>
    </>
  );
};

export default Chatroom;
