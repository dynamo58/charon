import { useGlobalContext } from "./store";
import { createContext, createSignal, useContext } from "solid-js";

export class Keybind {
  desc: string;
  cb: (evt: KeyboardEvent) => void;
  activator: (evt: KeyboardEvent) => boolean;

  constructor(
    desc: string,
    activator: (evt: KeyboardEvent) => boolean,
    cb: (evt: KeyboardEvent) => void
  ) {
    this.desc = desc;
    this.cb = cb;
    this.activator = activator;
  }

  eval(evt: KeyboardEvent) {
    if (this.activator(evt)) this.cb(evt);
  }
}

interface KBContextProps {
  registerKeybind: (kb: Keybind) => void;
}

const KeybindContext = createContext<KBContextProps>();

export function KeybindManager(props: any) {
  const [keybinds, setKeybinds] = createSignal<Keybind[]>([
    // default keybinds

    new Keybind(
      "Open a channel",
      (e) => e.ctrlKey && e.key === "n",
      (_) => {
        const new_tab_label = prompt("New chanel:");
        if (new_tab_label !== null) openTab(new_tab_label);
      }
    ),
  ]);
  const { openTab } = useGlobalContext();

  window.addEventListener("keydown", async (e) => {
    keybinds().forEach((kb) => {
      kb.eval(e);
    });

    // // fallback to random chars activating the message input
    // if (/[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.shiftKey && !e.altKey) {
    //   // ...
    // }
  });

  const registerKeybind = (kb: Keybind) => {
    setKeybinds((kbs) => [...kbs, kb]);
  };

  return (
    <KeybindContext.Provider
      value={{
        registerKeybind,
      }}
    >
      {props.children}
    </KeybindContext.Provider>
  );
}

export const useKeybindManager = () => useContext(KeybindContext)!;
