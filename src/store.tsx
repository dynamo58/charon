import { invoke } from "@tauri-apps/api";
import {
  Accessor,
  Setter,
  createContext,
  useContext,
  createSignal,
  onMount,
} from "solid-js";
import { Tab, Config, IPreferences, Platform } from "./types";
import { Theme } from "./types";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/window";

interface ContextProps {
  tabs: Accessor<Tab[]>;
  openTab: (label: string, platform: Platform) => void;
  closeTab: (tabIdx: number) => void;
  setNewTabs: (ts: Tab[], newIdx: number) => void;
  currTabIdx: Accessor<number>;
  setCurrTabIdx: Setter<number>;
  theme: Accessor<Theme>;
  setTheme: Setter<Theme>;
}

const GlobalContext = createContext<ContextProps>();

export function GlobalContextProvider(props: any) {
  // ==========================================================================
  // LOCALS
  // ==========================================================================

  // ==========================================================================
  // REACTIVITY
  // ==========================================================================

  const [tabs, setTabs] = createSignal<Tab[]>([]);
  const [currTabIdx, setCurrTabIdx] = createSignal<number>(0);

  const [theme, setTheme] = createSignal<Theme>({
    colors: {
      fgMain: "#fff8e0",
      fgAlt: "#ccc6af",

      bgMain: "#202020",
      bgSec: "#121212",
      bgTern: "#303030",

      accent1: "#ffee00",
      accent2: "#00f2ff",

      border: "#505050",
    },
    fontSizes: {
      small: "0.7em",
    },

    fonts: {
      chat: "Arial",
      ui: "Arial",
      scale: 1.0,
    },

    backdrop: {
      property: "none",
    },
  });

  // ==========================================================================
  // WRAPPERS
  // ==========================================================================

  const openTab = async (label: string, platform: Platform) => {
    console.log(
      `[TABS] opening channel using label ${label} and platform ${platform}`
    );

    const uuid = (await invoke("generate_uuid")) as string;
    await invoke("join_channel", { channelName: label.toLowerCase() });

    const channel: Tab = {
      platform,
      uuid,
      label: label.toLowerCase(),
      ident: label.toLowerCase(),
    };

    setTabs((t) => [...t, channel]);
    setCurrTabIdx((_) => tabs().length - 1);

    saveConfig();
  };

  const closeTab = async (tabIdx: number) => {
    const tab = tabs()[tabIdx];

    // close the tab
    setTabs((t) => t.filter((_a, i) => i !== tabIdx));

    // get rid of the channel data by parting it iff
    // its data isnt needed in a tab elsewhere
    if (
      !tabs().some((t) => t.platform === tab.platform && t.ident === tab.ident)
    ) {
      await invoke("part_channel", { channelName: tab.ident });
    }

    saveConfig();
  };

  const setNewTabs = (ts: Tab[], newIdx: number) => {
    setTabs(ts);
    setCurrTabIdx(newIdx);
    saveConfig();
  };

  const gatherConfig = (): Config => {
    return {
      tabs: tabs(),
      font_ui: theme().fonts.ui,
      font_chat: theme().fonts.chat,
      font_scale: theme().fonts.scale,
      backdrop: theme().backdrop,
    };
  };

  const saveConfig = async () => {
    await invoke("save_config", {
      jsonStr: JSON.stringify(gatherConfig()),
    });
  };

  onMount(async () => {
    let res = JSON.parse(await invoke("fetch_config")) as Config;
    setTabs(res.tabs);
    setTheme((t) => {
      return {
        ...t,
        fonts: {
          ui: res.font_ui,
          chat: res.font_chat,
          scale: res.font_scale,
        },
        backdrop: res.backdrop,
      };
    });

    listen("request_prefs", async () => {
      console.log(`[STORE] got request to deliver preferences to their tab`);
      const prefs_window = WebviewWindow.getByLabel("preferences")!;

      let prefs: IPreferences = {
        font: theme().fonts.ui,
        fontScale: theme().fonts.scale,
        backdrop: theme().backdrop,
      };

      prefs_window.emit("prefs_for_prefs", prefs);
    });

    listen("prefs_for_main", async (e) => {
      console.log(`[STORE] preferences window is pushing`);
      const prefs = JSON.parse(e.payload as string) as IPreferences;

      setTheme((t) => {
        return {
          ...t,
          fonts: {
            ...t.fonts,
            scale: prefs.fontScale,
            ui: prefs.font,
          },
          backdrop: prefs.backdrop,
        };
      });

      await invoke("save_config", {
        jsonStr: JSON.stringify(gatherConfig()),
      });
    });
  });

  return (
    <GlobalContext.Provider
      value={{
        tabs,
        openTab,
        closeTab,
        setNewTabs,
        currTabIdx,
        setCurrTabIdx,
        theme,
        setTheme,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}

export const useGlobalContext = () => useContext(GlobalContext)!;
