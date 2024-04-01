import { onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { listen } from "@tauri-apps/api/event";

interface IRecievedMessage {
  message: string,
}

function App() {
  let messagesRef: HTMLDivElement;

  onMount(async () => {
    await listen('chat-msg', (event: any) => {
      let pl = event.payload as IRecievedMessage;

      messagesRef.innerHTML += `<span>${pl.message}</span><br>`;
      messagesRef.scrollTop = messagesRef.scrollHeight;
      console.log(event);
    })

    // await invoke("send_message", { message: "xd", channelName: "pepega00000" })
  });

  return (<>
    <div id="tabs">tabs here</div>
    <div id="messages" ref={messagesRef!}></div>
    <div id="send-msg-field">send msg here</div>
  </>);
}

export default App;
