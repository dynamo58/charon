import { For, Match, Switch, createSignal, onMount } from "solid-js";
import { IPrivmgPayload, IUsernoticePayload, PayloadKind } from "../types";
import { listen } from "@tauri-apps/api/event";
import { styled } from "solid-styled-components";
import { MAX_LINE_COUNT_PER_CHAT } from "../constants";
import Privmsg from "./messages/Privmsg";
import Usernotice from "./messages/Usernotice";
import { invoke } from "@tauri-apps/api";

const ChatroomDiv = styled.span<{ isActive: boolean }>`
  width: calc(100vw -10px);
  padding-left: 0.3em;
  padding-right: 0.3em;
  display: ${(props) => (props.isActive ? "block" : "none")};
  background-color: ${(props) => props.theme?.colors.bgSec};
  & .emote {
    height: 2em !important;
    display: inline-block;
  }
`;

interface IChatroomProps {
  isActive: boolean;
  channelName: string;
}

interface IMessageWrapper {
  kind: PayloadKind;
  data: IPrivmgPayload | IUsernoticePayload;
}

const Chatroom = (props: IChatroomProps) => {
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
      divRef.removeChild(divRef.firstChild!);
    } else {
      lineCount++;
    }

    divRef.parentElement!.scrollTop = 9999;
  };

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
  });

  return (
    <>
      <ChatroomDiv isActive={props.isActive} ref={divRef!}>
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
      </ChatroomDiv>
    </>
  );
};

export default Chatroom;
