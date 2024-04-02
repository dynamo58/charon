import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { listen } from "@tauri-apps/api/event";

import ChatMessage from "./components/ChatMesasge";
import { For } from "solid-js";

import { IRecievedMessage } from "./types";

import Tab from "./components/Tab";
import { useGlobalContext } from "./store";


function App() {
  const { tabs, currTabIdx } = useGlobalContext()
  let messagesRef: HTMLDivElement;
  let messageInputRef: HTMLInputElement;
  let [messages, setMessages] = createSignal<IRecievedMessage[]>([]);
  let [message, setMessage] = createSignal<string>("");


  onMount(async () => {
    await listen('chat-msg', (event: any) => {
      let pl = event.payload as IRecievedMessage;

      setMessages((ms) => [...ms, pl]);
      messagesRef.scrollTop = messagesRef.scrollHeight;
    })
  });

  const handleMessageSubmission = async (e: KeyboardEvent) => {
    if (e.key !== "Enter" || message() === "") return;

    console.log(await invoke("send_message", { message: message(), channelName: tabs()[currTabIdx()] }))

    if (!e.ctrlKey) messageInputRef.value = "";
  }

  return (<>
    <div id="tabs">
      <For each={tabs()}>
        {(item, idx) => (
          <Tab
            index={idx()}
            isActive={idx() === currTabIdx()}
            isChannelLive={false}
          >{item}</Tab>
        )}
      </For>
    </div>
    <div id="messages" ref={messagesRef!}>
      <For each={messages()}>
        {(item, _) => (
          <ChatMessage {...item} ></ChatMessage>
        )}
      </For>
      {/* <div class="cover-bar"></div> */}
    </div>
    <div id="send-msg-field">
      <input
        type="text"
        ref={messageInputRef!}
        onChange={(val) => setMessage((_) => val.target.value)}
        onkeyup={handleMessageSubmission}
      />
    </div>
  </>);
}

export default App;
