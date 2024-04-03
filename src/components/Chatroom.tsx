import { For, createSignal, onMount } from "solid-js";
import { IRecievedMessage } from "../types";
import { listen } from "@tauri-apps/api/event";
import { styled } from "solid-styled-components";
import { MAX_LINE_COUNT_PER_CHAT } from "../constants";
import ChatMessage from "./ChatMessage";

// export interface IRecievedMessage {
//   sender_nick: string;
//   color: string;
//   message: string;
// }

const ChatroomDiv = styled.span<{ isActive: boolean }>`
  width: 100%;
  padding-left: 0.3em;
  padding-right: 0.3em;
  display: ${(props) => (props.isActive ? "block" : "none")};
  height: 90vh;
  overflow: hidden;
  overflow-wrap: break-word;
  background-color: ${(props) => props.theme?.colors.bgSec};
  &:hover {
    overflow-y: scroll;
  }
`;

interface IChatroomProps {
  isActive: boolean;
  channelName: string;
}

const Chatroom = (props: IChatroomProps) => {
  let divRef: HTMLDivElement;
  let [messages, setMessages] = createSignal<IRecievedMessage[]>([]);
  let lineCount = 0;

  onMount(async () => {
    await listen(`chat-msg__${props.channelName}`, (event: any) => {
      let pl = event.payload as IRecievedMessage;

      setMessages((ms) => [...ms, pl]);

      if (lineCount >= MAX_LINE_COUNT_PER_CHAT) {
        divRef.removeChild(divRef.firstChild!);
      } else {
        lineCount++;
      }

      divRef.scrollTop = divRef.scrollHeight;
    });
  });

  return (
    <>
      <ChatroomDiv isActive={props.isActive} ref={divRef!}>
        <For each={messages()}>
          {(item, _) => <ChatMessage {...item}></ChatMessage>}
        </For>
      </ChatroomDiv>
    </>
  );
};

export default Chatroom;
