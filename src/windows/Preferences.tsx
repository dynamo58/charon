import { css } from "solid-styled";
import {
  For,
  Show,
  Suspense,
  createResource,
  createSignal,
  onMount,
} from "solid-js";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { WebviewWindow, appWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api";
import { useGlobalContext } from "../store";
import { IPreferences } from "../types";
import { STATIC_FONTS } from "../constants";
import { listen } from "@tauri-apps/api/event";

function Preferences() {
  const { setTheme, theme } = useGlobalContext();
  const main_window = WebviewWindow.getByLabel("main")!;

  // ====================================================
  // All the different sections of the preferences window

  let aboutSection: HTMLHeadingElement;
  let appearanceSection: HTMLHeadingElement;

  // ====================================================

  let [fonts, setFonts] = createSignal<string[]>([]);
  let [fontScale, setFontScale] = createSignal(1.0);

  // ====================================================

  const gatherPrefs = (): IPreferences => {
    return {
      font: theme().fonts.ui,
      fontScale: fontScale(),
      backdropImage: null,
    };
  };

  const applyPrefs = (prefs: IPreferences) => {
    setTheme((t) => {
      return {
        ...t,
        fonts: {
          ...t.fonts,
          ui: prefs.font,
          chat: prefs.font,
        },
      };
    });

    setFontScale(prefs.fontScale);
    // TODO: set backdrop
  };

  // ====================================================

  onMount(async () => {
    let res = (await invoke("get_system_fonts")) as string;
    let ffs = JSON.parse(res) as string[];
    setFonts([...ffs, ...STATIC_FONTS]);

    console.log(`requesting prefs from main ${WebviewWindow.name}`);
    await main_window.emit("request_prefs");
  });

  listen("prefs_for_prefs", (e) => {
    console.log(`received prefs from main`);
    const prefs = e.payload as IPreferences;
    console.log(prefs);
    applyPrefs(prefs);
  });

  // ====================================================

  const handleFontChange = async (s: string) => {
    setTheme((t) => {
      return {
        ...t,
        fonts: {
          ...t.fonts,
          ui: s,
          chat: s,
        },
      };
    });

    await main_window.emit("prefs_for_main", JSON.stringify(gatherPrefs()));
  };

  // ====================================================

  const handleFontScaleChange = async (s: string) => {
    const newScale = parseFloat(s);
    setFontScale(newScale);
    await main_window.emit("prefs_for_main", JSON.stringify(gatherPrefs()));
  };

  // ====================================================

  const [metadata] = createResource(async () => {
    return {
      version: await getVersion(),
      tauriVersion: await getTauriVersion(),
    };
  });

  // ====================================================

  css`
    p.clickable {
      font-weight: bold;
      color: ${theme().colors.accent1};
      cursor: pointer;
      width: 100%;
    }

    #sidebar {
      background-color: ${theme().colors.bgTern};
      border-right: 1px solid ${theme().colors.fgMain};
      border-top-right-radius: 1em;
      border-bottom-right-radius: 1em;
      width: 12em;
      padding-top: 2em;
    }

    #ok-btn {
      color: ${theme().colors.fgMain};
      border: 2px solid ${theme().colors.accent1};
      background-color: ${theme().colors.accent1}22;
      border-radius: 4px;
      position: absolute;
      right: 1em;
      bottom: 1em;
      min-width: 5em;
      font-weight: bold;
    }

    #preferences {
      background-color: ${theme().colors.bgMain};
      color: ${theme().colors.fgMain};
      font-family: ${theme().fonts.ui};
      height: 100vh;
      max-height: 100vh;
      width: 100vw;
      max-width: 100vw;
      display: flex;
      & > div {
        height: 100%;
        padding: 2em;
        overflow-y: scroll;
        scroll-behavior: smooth;
      }

      & a {
        color: ${theme().colors.accent2};
        text-decoration: none;
        font-weight: 600;
        margin: 0 0.2em;
      }
    }

    input,
    select {
      max-width: 10em;
      height: 2em;
    }
  `;

  return (
    <>
      <div id="preferences">
        <div id="sidebar">
          <p
            class="clickable"
            onclick={() => appearanceSection.scrollIntoView()}
          >
            Appearance
          </p>
          <p class="clickable" onclick={() => aboutSection.scrollIntoView()}>
            About
          </p>
        </div>
        <div id="fields">
          <h3 ref={appearanceSection!}>Appearance</h3>

          <label for="fonts">Font: </label>
          <select
            name="fonts"
            onChange={(e) => handleFontChange(e.target.value)}
          >
            <For each={fonts()}>
              {(item, _idx) => (
                <option value={item} selected={item === theme().fonts.ui}>
                  {item}
                </option>
              )}
            </For>
          </select>

          <br />

          <label for="fontScale">Font scaling: </label>
          <input
            type="number"
            name="fontScale"
            value={fontScale()}
            onChange={(e) => handleFontScaleChange(e.target.value)}
          />

          <hr />

          <h3 ref={aboutSection!}>About</h3>
          <p>
            <b>Charon version: </b>
            <Suspense fallback={<span>Loading version...</span>}>
              <Show when={metadata()}>
                <span>{metadata()?.version}</span>
              </Show>
            </Suspense>
          </p>
          <p>
            <b>Tauri version: </b>
            <Suspense fallback={<span>Loading version...</span>}>
              <Show when={metadata()}>
                <span>{metadata()?.tauriVersion}</span>
              </Show>
            </Suspense>
          </p>
          <b>Links</b>
          <ul>
            <li>
              Source code:{" "}
              <a target="_blank" href="https://github.com/dynamo58/charon">
                github.com/dynamo58/charon
              </a>
            </li>
          </ul>

          <b>Credits</b>
          <p>
            Special thanks to the following open source projects without which
            this wouldn't be possible!
          </p>

          <ul>
            <li>
              <a target="_blank" href="https://tauri.app/">
                Tauri
              </a>
            </li>
            <li>
              <a target="_blank" href="https://www.solidjs.com/">
                SolidJS
              </a>
            </li>
          </ul>
        </div>
        <button id="ok-btn" onclick={() => appWindow.close()}>
          Ok
        </button>
      </div>
    </>
  );
}

export default Preferences;
