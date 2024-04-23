import { invoke } from "@tauri-apps/api";
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

    if (shouldTrigger) {
      console.log(`[INFO][KBM]\t Running "${this.desc}"`);
      this.cb(evt);
    }

    return shouldTrigger && this.blocks;
  }
}

interface KBContextProps {
  registerKeybind: (kb: Keybind) => void;
  triggerManually: (e: KeyboardEvent) => void;
}

const KeybindContext = createContext<KBContextProps>();

export function KeybindManager(props: any) {
  const [keybinds, setKeybinds] = createSignal<Keybind[]>([
    // default global keybinds

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

  const handleKeydown = (e: KeyboardEvent) => {
    for (let kb of keybinds()) {
      if (kb.eval(e)) break;
    }
  };

  window.addEventListener("keydown", async (e) => {
    handleKeydown(e);
  });

  const triggerManually = (e: KeyboardEvent) => {
    handleKeydown(e);
  };

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
        triggerManually,
        registerKeybind,
      }}
    >
      {props.children}
    </KeybindContext.Provider>
  );
}

export const useKeybindManager = () => useContext(KeybindContext)!;
