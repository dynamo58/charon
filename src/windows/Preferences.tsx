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
import { Backdrop, IPreferences } from "../types";
import { STATIC_FONTS } from "../constants";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";
import { convertFileSrc } from "@tauri-apps/api/tauri";

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
  let [backdrop, setBackdrop] = createSignal<Backdrop>({
    property: "none",
  });

  // ====================================================

  const gatherPrefs = (): IPreferences => {
    return {
      font: theme().fonts.ui,
      fontScale: fontScale(),
      backdrop: backdrop(),
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
    setIsCustomBackground(prefs.backdrop.property !== "none");
    setBackdrop(prefs.backdrop);
  };

  // ====================================================

  onMount(async () => {
    let res = (await invoke("get_system_fonts")) as string;
    let ffs = JSON.parse(res) as string[];
    setFonts([...STATIC_FONTS, ...ffs]);

    console.log(`requesting prefs from main ${WebviewWindow.name}`);
    await main_window.emit("request_prefs");
  });

  listen("prefs_for_prefs", (e) => {
    console.log(`received prefs from main`);
    const prefs = e.payload as IPreferences;
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

  const [isCustomBackground, setIsCustomBackground] =
    createSignal<boolean>(false);

  const handleBackdropSelect = async () => {
    const selected = await open({
      filters: [
        {
          name: "Image",
          extensions: ["png", "jpg", "jpeg", "webp", "gif"],
        },
      ],
    });
    if (Array.isArray(selected)) {
      // user selected multiple files
    } else if (selected === null) {
      // user cancelled the selection
    } else {
      setBackdrop({
        property: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
        url("${convertFileSrc(selected)}")`,
      });
      await main_window.emit("prefs_for_main", JSON.stringify(gatherPrefs()));
    }
  };

  const handleIsCustomBackgroundChange = async () => {
    setIsCustomBackground(!isCustomBackground());

    if (isCustomBackground()) {
    } else {
      setBackdrop({ property: "none" });
    }

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
      cursor: pointer;
      width: 100%;
      font-weight: 700;
    }

    #sidebar {
      padding: 1em;
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

    input {
      max-width: 10em;
      height: 2em;
    }

    .customBackgroundImage-cb {
      height: 1.5em !important;
      width: 1.5em !important;
      padding-top: 25px;
      display: inline-block;
      vertical-align: middle;
    }

    .inlay {
      padding-left: 3em;
    }
  `;

  const Links = [
    {
      label: "Appearance",
      anchor: appearanceSection!,
    },
    {
      label: "About",
      anchor: aboutSection!,
    },
  ];

  return (
    <div id="preferences">
      <div id="sidebar">
        {Links.map((l) => (
          <p class="clickable" onclick={() => l.anchor.scrollIntoView()}>
            {l.label}
          </p>
        ))}
      </div>
      <div id="fields">
        <h3 ref={appearanceSection!}>Appearance</h3>

        <label for="fonts">Font: </label>
        <select name="fonts" onChange={(e) => handleFontChange(e.target.value)}>
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

        <br />

        <label for="customBackgroundImage">Enable custom background: </label>
        <input
          name="customBackgroundImage"
          type="checkbox"
          class="customBackgroundImage-cb"
          checked={isCustomBackground()}
          onChange={() => handleIsCustomBackgroundChange()}
        />

        <Show when={isCustomBackground()}>
          <div class="inlay">
            <button onclick={handleBackdropSelect}>Select a picture</button>
            <br />
          </div>
        </Show>

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
  );
}

export default Preferences;
