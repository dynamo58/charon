import { For, Match, Switch, createSignal, onMount } from "solid-js";
import { IPrivmgPayload, IUsernoticePayload, IPayloadKind } from "../types";
import { listen } from "@tauri-apps/api/event";
import { styled } from "solid-styled-components";
import { MAX_LINE_COUNT_PER_CHAT } from "../constants";
import Privmsg from "./messages/Privmsg";
import Usernotice from "./messages/Usernotice";

const ChatroomDiv = styled.span<{ isActive: boolean }>`
  width: 100%;
  padding-left: 0.3em;
  padding-right: 0.3em;
  display: ${(props) => (props.isActive ? "block" : "none")};
  background-color: ${(props) => props.theme?.colors.bgSec};
  &:hover {
    overflow-y: scroll;
  }
`;

interface IChatroomProps {
  isActive: boolean;
  channelName: string;
}

interface IMessageWrapper {
  kind: IPayloadKind;
  data: IPrivmgPayload | IUsernoticePayload;
}

const Chatroom = (props: IChatroomProps) => {
  let divRef: HTMLDivElement;
  let [messages, setMessages] = createSignal<IMessageWrapper[]>([]);
  let lineCount = 0;

  //                 this comma is very important
  //                 due to .tsx syntax error issues
  const handlePayload = <T,>(event: any, kind: IPayloadKind) => {
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

    divRef.parentElement!.scrollTop = divRef.scrollHeight;
  };

  onMount(async () => {
    await listen(`privmsg__${props.channelName}`, (event: any) => {
      console.log(event.payload);
      handlePayload<IPrivmgPayload>(event, IPayloadKind.Privmsg);
    });
    await listen(`usernotice__${props.channelName}`, (event: any) => {
      console.log(event.payload);
      handlePayload<IUsernoticePayload>(event, IPayloadKind.Usernotice);
    });
  });

  return (
    <>
      <ChatroomDiv isActive={props.isActive} ref={divRef!}>
        <For each={messages()}>
          {(item, _) => {
            console.log(item.kind);

            return (
              <Switch>
                <Match when={item.kind === IPayloadKind.Privmsg}>
                  <Privmsg {...(item.data as IPrivmgPayload)}></Privmsg>
                </Match>
                <Match when={item.kind === IPayloadKind.Usernotice}>
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
