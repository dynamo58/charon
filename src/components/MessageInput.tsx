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

  const handleInputChange = (newInput: string) => {
    if (newInput.length === 0) {
      setMessage("");
      return;
    }

    // look if the last word isnt by chance
    // a prefaced with `:` which would mean
    // an attempt to open the emote hinter
    const lastWord = newInput.split(" ").slice(-1)[0];
    if (lastWord.length > 1 && lastWord.startsWith(":"))
      window.dispatchEvent(
        new CustomEvent<string>("lookingForEmote", {
          detail: newInput.slice(1),
        })
      );
    else window.dispatchEvent(new Event("closeEmoteHinter"));

    setMessage(newInput);
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

  window.addEventListener("emoteChosen", ((evt: CustomEvent<string>) => {
    const emoteCode = evt.detail;

    // replace the last word with the emote
    let newMes = [message().split(" ").slice(0, -1), emoteCode, " "].join(" ");

    setMessage(newMes);
    window.dispatchEvent(new Event("closeEmoteHinter"));
    messageInputRef.focus();
  }) as EventListener);

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
      padding-right: 4em;
    }

    input:focus {
      outline: none;
    }

    .message-len {
      position: absolute;
      right: 1em;
      bottom: 0.5em;
      user-select: none;
    }

    #message {
      display: block;
    }

    .message-len {
      color: ${message().length > 500 ? "red" : `${theme().colors.fgAlt}88`};
      display: ${message().length === 0 ? "none" : "block"};
    }
  `;

  return (
    <>
      <div id="message">
        <input
          type="text"
          ref={messageInputRef!}
          value={message()}
          oninput={(el) => handleInputChange(el.target.value)}
          onkeyup={handleMessageSubmission}
          placeholder="Send a message..."
        />
        <div class="message-len">{message().length}</div>
      </div>
    </>
  );
};

export default MessageInput;
