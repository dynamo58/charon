import { invoke } from "@tauri-apps/api";
import {
  Accessor,
  Setter,
  createContext,
  useContext,
  createSignal,
  onMount,
} from "solid-js";
import { Config, IPreferences } from "./types";
import { Theme } from "./types";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/window";

interface ContextProps {
  tabs: Accessor<string[]>;
  openTab: (label: string) => void;
  currTabIdx: Accessor<number>;
  setCurrTabIdx: Setter<number>;
  closeTab: (label: string) => void;
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

  const [tabs, setTabs] = createSignal<string[]>([]);
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
  });

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

  const gather_config = (): Config => {
    return {
      channels: tabs(),
      font_ui: theme().fonts.ui,
      font_chat: theme().fonts.chat,
      font_scale: theme().fonts.scale,
      backdrop_image: null,
    };
  };

  const saveConfig = async () => {
    console.log(
      await invoke("save_config", {
        jsonStr: JSON.stringify(gather_config()),
      })
    );
  };

  onMount(async () => {
    let res = JSON.parse(await invoke("fetch_config")) as Config;
    setTabs(res.channels);
    setTheme((t) => {
      return {
        ...t,
        fonts: {
          ui: res.font_ui,
          chat: res.font_chat,
          scale: res.font_scale,
        },
      };
    });

    listen("request_prefs", async () => {
      console.log(`recd preferences window request`);
      const prefs_window = WebviewWindow.getByLabel("preferences")!;
      console.log({ prefs_window });

      prefs_window.emit("prefs_for_prefs", {
        font: theme().fonts.ui,
        fontScale: theme().fonts.scale,
        backdropImage: null, // TODO: backdrop
      });
    });

    listen("prefs_for_main", async (e) => {
      console.log(`got prefs from preferences window`);
      const prefs = JSON.parse(e.payload as string) as IPreferences;

      setTheme((t) => {
        return {
          ...t,
          fonts: {
            ...t.fonts,
            scale: prefs.fontScale,
            ui: prefs.font,
          },
        };
      });

      window.dispatchEvent(new Event("scrollChat"));

      console.log(
        await invoke("save_config", {
          jsonStr: JSON.stringify(gather_config()),
        })
      );
    });
  });

  return (
    <GlobalContext.Provider
      value={{
        tabs,
        openTab,
        currTabIdx,
        setCurrTabIdx,
        closeTab,
        theme,
        setTheme,
      }}
    >
      {props.children}
    </GlobalContext.Provider>
  );
}

export const useGlobalContext = () => useContext(GlobalContext)!;
