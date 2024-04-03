import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { For } from "solid-js";
import Chatroom from "./components/Chatroom";

import Tab from "./components/Tab";
import { useGlobalContext } from "./store";

function App() {
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
    <>
      <div id="tabs">
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
      </div>
      <For each={tabs()}>
        {(item, idx) => (
          <Chatroom
            channelName={item}
            isActive={idx() === currTabIdx()}
          ></Chatroom>
        )}
      </For>
      <div id="send-msg-field">
        <input
          type="text"
          ref={messageInputRef!}
          onChange={(val) => setMessage((_) => val.target.value)}
          onkeyup={handleMessageSubmission}
        />
      </div>
    </>
  );
}

export default App;
