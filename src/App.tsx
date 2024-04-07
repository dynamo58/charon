import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { For } from "solid-js";
import Chatroom from "./components/Chatroom";

import Tab from "./components/Tab";
import { useGlobalContext } from "./store";
import { styled } from "solid-styled-components";

const AppDiv = styled.div`
  background-color: ${(props) => props.theme?.colors.bgMain};
  color: ${(props) => props.theme?.colors.fgMain};
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;

  & a {
    color: ${(props) => props.theme?.colors.accent2};
    text-decoration: none;
    font-weight: 600;
  }
`;

const TabDiv = styled.div``;

const ChatroomDiv = styled.div<{ tdr: HTMLDivElement }>`
  background-color: ${(props) => props.theme?.colors.bgSec};
  flex-grow: 1;
  overflow-x: hidden;
  overflow-wrap: break-word;
  &:hover {
    overflow-y: overlay;
  }
`;

const MessageDiv = styled.div`
  & > input {
    width: 100%;
    height: 3em;
    border: none;
    background-color: ${(props) => props.theme?.colors.bgMain};
    color: ${(props) => props.theme?.colors.fgMain};
  }

  & > input:focus {
    outline: none;
  }
`;

function App() {
  let topBarRef: HTMLDivElement;
  const { tabs, currTabIdx } = useGlobalContext();
  let messageInputRef: HTMLInputElement;
  let [message, setMessage] = createSignal<string>("");

  const handleMessageSubmission = async (e: KeyboardEvent) => {
    if (e.key !== "Enter" || message() === "") return;

    console.log(
      await invoke("send_message", {
        message: message(),
        channelName: tabs()[currTabIdx()],
      })
    );

    if (!e.ctrlKey) messageInputRef.value = "";
  };

  return (
    <AppDiv>
      <TabDiv ref={topBarRef!}>
        <For each={tabs()}>
          {(item, idx) => (
            <Tab
              index={idx()}
              isActive={idx() === currTabIdx()}
              isChannelLive={false}
              channelName={item}
            ></Tab>
          )}
        </For>
      </TabDiv>
      <ChatroomDiv tdr={topBarRef!}>
        <For each={tabs()}>
          {(item, idx) => (
            <Chatroom
              channelName={item}
              isActive={idx() === currTabIdx()}
            ></Chatroom>
          )}
        </For>
      </ChatroomDiv>
      <MessageDiv>
        <input
          type="text"
          ref={messageInputRef!}
          onChange={(val) => setMessage((_) => val.target.value)}
          onkeyup={handleMessageSubmission}
        />
      </MessageDiv>
    </AppDiv>
  );
}

export default App;
