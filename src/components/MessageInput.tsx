import { css } from "solid-styled";
import { useGlobalContext } from "../store";
import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api";
import { useKeybindManager } from "../KeybindManager";
import { Keybind } from "../KeybindManager";

const MessageInput = () => {
  const { theme, tabs, currTabIdx } = useGlobalContext();
  const { registerKeybind } = useKeybindManager();

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

  // fallback to random chars activating the message input
  registerKeybind(
    new Keybind(
      "focus chat on random keypresses",
      (e) => /[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.shiftKey && !e.altKey,
      (_) => {
        messageInputRef.focus();
      }
    )
  );

  css`
    input {
      width: 100vw;
      height: 3em;
      border: none;
      background-color: ${theme().colors.bgMain};
      color: ${theme().colors.fgMain};
      padding: 0 0.5em;
      overflow-wrap: break-word;
      overflow: hidden;
      display: block;
    }

    input:focus {
      outline: none;
    }
  `;

  return (
    <div id="message">
      <input
        type="text"
        ref={messageInputRef!}
        onChange={(val) => setMessage((_) => val.target.value)}
        onkeyup={handleMessageSubmission}
      />
    </div>
  );
};

export default MessageInput;
