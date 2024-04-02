import { invoke } from "@tauri-apps/api";
import {
  Accessor,
  Setter,
  createContext,
  useContext,
  createSignal,
  onMount,
} from "solid-js";

const DEFAULT_SETTINGS = {
  tabs: ["pepega00000", "gkey"],
  currTabIdx: 0,
};

interface ContextProps {
  tabs: Accessor<string[]>;
  openTab: (label: string) => void;
  currTabIdx: Accessor<number>;
  setCurrTabIdx: Setter<number>;
  closeTab: (label: string) => void;
}

const GlobalContext = createContext<ContextProps>();

export function GlobalContextProvider(props: any) {
  const [tabs, setTabs] = createSignal<string[]>(DEFAULT_SETTINGS.tabs);
  const [currTabIdx, setCurrTabIdx] = createSignal<number>(
    DEFAULT_SETTINGS.currTabIdx
  );

  const openTab = async (label: string) => {
    setTabs((t) => [...t, label]);
    await invoke("join_channel", { channelName: label.toLowerCase() });
  };

  const closeTab = async (label: string) => {
    setTabs((t) => t.filter((a) => a !== label));
    await invoke("part_channel", { channelName: label });
  };

  onMount(async () => {
    // TODO: fetch config
  });

  return (
    <GlobalContext.Provider
      value={{
        tabs,
        openTab,
        currTabIdx,
        setCurrTabIdx,
        closeTab,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}

export const useGlobalContext = () => useContext(GlobalContext)!;
