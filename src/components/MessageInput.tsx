import { css } from "solid-styled";
import { useGlobalContext } from "../store";
import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api";
import { useKeybindManager } from "../KeybindManager";
import { Keybind } from "../KeybindManager";
import { Emote } from "../types";

const MessageInput = () => {
  const { theme, tabs, currTabIdx } = useGlobalContext();
  const { registerKeybind } = useKeybindManager();

  let messageInputRef: HTMLInputElement;

  let [message, setMessage] = createSignal<string>("");
  let [cursorPos, setCursorPos] = createSignal<number>(0);
  let [lookingForEmote, setLookingForEmote] = createSignal<boolean>(true);

  const handleMessageSubmission = async (e: KeyboardEvent) => {
    if (e.key !== "Enter" || message() === "" || lookingForEmote()) return;

    await invoke("send_message", {
      message: message(),
      channelName: tabs()[currTabIdx()].ident,
    });

    if (!e.ctrlKey) messageInputRef.value = "";
  };

  const handleInputChange = (e: InputEvent & { target: HTMLInputElement }) => {
    const newInput = e.target.value;
    setCursorPos(e.target.selectionStart ?? 0);

    if (newInput.length === 0) {
      setMessage("");
      return;
    }

    // look if the last word isnt by chance
    // a prefaced with `:` which would mean
    // an attempt to open the emote hinter
    const lastWord = newInput.split(" ").slice(-1)[0];
    if (lastWord.length > 1 && lastWord.startsWith(":")) {
      window.dispatchEvent(
        new CustomEvent<string>("lookingForEmote", {
          detail: lastWord.slice(1),
        })
      );
      setLookingForEmote(true);
    } else {
      window.dispatchEvent(new Event("closeEmoteHinter"));
      setLookingForEmote(false);
    }

    setMessage(newInput);
  };

  // turn the word before the cursor into an emote upon <Tab> press
  registerKeybind(
    new Keybind(
      "tab an emote",
      (e) => e.key === "Tab" && !lookingForEmote(),
      async () => {
        let msg = message();
        const afterWordStartIdx = cursorPos();

        let currIdx = cursorPos();
        while (currIdx > 0 && msg.charAt(currIdx - 1) !== " ") currIdx--;

        const word = msg.slice(currIdx, afterWordStartIdx);
        const beforeWord = message().slice(0, currIdx);
        const afterWord = message().slice(afterWordStartIdx);

        if (word.length == 0) return;
        const matchedEmotes = JSON.parse(
          (await invoke("query_emotes", {
            channelLogin: tabs()[currTabIdx()].ident,
            s: word,
          })) as string
        ) as Emote[];

        if (matchedEmotes.length === 0) return;

        setMessage(beforeWord + matchedEmotes[0].code + " " + afterWord);

        messageInputRef.focus();
        messageInputRef.selectionStart =
          beforeWord.length + matchedEmotes[0].code.length + 2;
        messageInputRef.selectionEnd =
          beforeWord.length + matchedEmotes[0].code.length + 2;
      }
    )
  );

  // // fallback to random chars activating the message input
  // registerKeybind(
  //   new Keybind(
  //     "focus chat on random keypresses",
  //     (e) => /[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.shiftKey && !e.altKey,
  //     (_) => {
  //       messageInputRef.focus();
  //     }
  //   )
  // );

  window.addEventListener("emoteChosen", ((evt: CustomEvent<string>) => {
    const emoteCode = evt.detail;

    // replace the last word with the emote
    let newMes = [...message().split(" ").slice(0, -1), emoteCode, " "].join(
      " "
    );

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
          oninput={(e) => handleInputChange(e)}
          onkeyup={handleMessageSubmission}
          //
          onkeydown={(e) =>
            setCursorPos((e.target as HTMLInputElement).selectionStart!)
          }
          onseeked={(e) =>
            setCursorPos((e.target as HTMLInputElement).selectionStart!)
          }
          onfocus={(e) =>
            setCursorPos((e.target as HTMLInputElement).selectionStart!)
          }
          placeholder="Send a message..."
        />
        <div class="message-len">{message().length}</div>
      </div>
    </>
  );
};

export default MessageInput;
