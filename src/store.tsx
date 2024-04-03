import { invoke } from "@tauri-apps/api";
import {
  Accessor,
  Setter,
  createContext,
  useContext,
  createSignal,
  onMount,
} from "solid-js";
import { Config } from "./types";

interface ContextProps {
  tabs: Accessor<string[]>;
  openTab: (label: string) => void;
  currTabIdx: Accessor<number>;
  setCurrTabIdx: Setter<number>;
  closeTab: (label: string) => void;
}

const GlobalContext = createContext<ContextProps>();

export function GlobalContextProvider(props: any) {
  // ==========================================================================
  // LOCALS
  // ==========================================================================

  // ==========================================================================
  // REACTIVITY
  // ==========================================================================

  const [tabs, setTabs] = createSignal<string[]>([]);
  const [currTabIdx, setCurrTabIdx] = createSignal<number>(0);

  // ==========================================================================
  // WRAPPERS
  // ==========================================================================

  const openTab = async (label: string) => {
    console.log(
      await invoke("join_channel", { channelName: label.toLowerCase() })
    );
    setTabs((t) => [...t, label]);
    setCurrTabIdx((_) => tabs().length - 1);

    saveConfig();
  };

  const closeTab = async (label: string) => {
    setTabs((t) => t.filter((a) => a !== label));
    console.log(await invoke("part_channel", { channelName: label }));

    saveConfig();
  };

  const saveConfig = async () => {
    const gathered_config: Config = {
      channels: tabs(),
    };

    console.log(
      await invoke("save_config", {
        jsonStr: JSON.stringify(gathered_config),
      })
    );
  };

  onMount(async () => {
    let res = JSON.parse(await invoke("fetch_config")) as Config;
    setTabs(res.channels);
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
