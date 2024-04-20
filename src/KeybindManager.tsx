import { invoke } from "@tauri-apps/api";
import { useGlobalContext } from "./store";
import { createContext, createSignal, useContext } from "solid-js";

export class Keybind {
  // just a description
  desc: string;
  // whether upon getting triggered should block all
  // other keybinds from being executed
  blocks: boolean;
  // predicate formula resolving whether the callback
  // should be ran or no
  activator: (evt: KeyboardEvent) => boolean;
  // assuming the keyboard combination specified by `activator`
  // was successfull, what should happen
  cb: (evt: KeyboardEvent) => void;

  constructor(
    desc: string,
    activator: (evt: KeyboardEvent) => boolean,
    cb: (evt: KeyboardEvent) => void,
    blocks?: boolean
  ) {
    this.desc = desc;
    this.cb = cb;
    this.activator = activator;
    this.blocks = !!blocks;
  }

  eval(evt: KeyboardEvent): boolean {
    const shouldTrigger = this.activator(evt);
    console.log("buh");
    console.log(this.desc, shouldTrigger, this.blocks);

    if (shouldTrigger) {
      console.log(`[INFO][KBM]\t Running "${this.desc}"`);
      this.cb(evt);
    }

    return shouldTrigger && this.blocks;
  }
}

interface KBContextProps {
  registerKeybind: (kb: Keybind) => void;
}

const KeybindContext = createContext<KBContextProps>();

export function KeybindManager(props: any) {
  const [keybinds, setKeybinds] = createSignal<Keybind[]>([
    // default global keybinds

    new Keybind(
      "Open a channel",
      (e) => e.ctrlKey && e.key === "n",
      (_) => {
        const new_tab_label = prompt("New chanel:");
        if (new_tab_label !== null) openTab(new_tab_label);
      }
    ),
    new Keybind(
      "Open preferences window",
      (e) => e.ctrlKey && e.key === "p",
      async (_) => {
        if (await invoke("open_preferences_window")) {
          console.log(`[INFO][KBM] Spawned preferences window`);
        }
      }
    ),
  ]);
  const { openTab } = useGlobalContext();

  window.addEventListener("keydown", async (e) => {
    for (let kb of keybinds()) {
      if (kb.eval(e)) break;
    }
  });

  const registerKeybind = (kb: Keybind) => {
    // order really matters here!
    // new keybinds are appended to the start,
    // hence when iterating through the key-
    // binds these ones have the priority
    // and may block the others from triggering
    setKeybinds((kbs) => [kb, ...kbs]);
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
