import { Show, createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { For } from "solid-js";
import Chatroom from "../components/Chatroom";

import Tab from "../components/Tab";
import { useGlobalContext } from "../store";
import AuthModal from "../components/AuthModal";
import { css } from "solid-styled";
import MessageInput from "../components/MessageInput";
import JoinChannelModal from "../components/JoinChannelModal";
import { Keybind, useKeybindManager } from "../KeybindManager";

const Main = () => {
  const { theme } = useGlobalContext();
  const { tabs, currTabIdx } = useGlobalContext();
  const { registerKeybind } = useKeybindManager();

  let topBarRef: HTMLDivElement;
  let appDivRef: HTMLDivElement;

  const [modalShowing, setModalShowing] = createSignal<boolean>(false);

  onMount(async () => {
    if (localStorage.getItem("token")) {
      await invoke("authentificate", {
        token: localStorage.getItem("token"),
      });
    } else {
      setModalShowing(true);

      let token = await invoke("authentificate", {
        token: localStorage.getItem("token"),
      });
      localStorage.setItem("token", token as string);

      setModalShowing(false);
    }
  });

  const [showJoinModal, setShowJoinModal] = createSignal<boolean>(false);

  registerKeybind(
    new Keybind(
      "open new channel",
      (e) => e.ctrlKey && e.key === "n",
      (_) => {
        setShowJoinModal(true);
      }
    )
  );

  window.addEventListener("close:join:channel:modal", () => {
    setShowJoinModal(false);
  });

  onMount(() => {
    setTimeout(() => {
      if (tabs().length === 0) {
        setShowJoinModal(true);
      }
    }, 500);
  });

  css`
    #main {
      background-color: ${theme().colors.bgMain};
      font-family: ${theme().fonts.ui};
      color: ${theme().colors.fgMain};
      height: 100vh;
      max-height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      & a {
        color: ${theme().colors.accent2};
        text-decoration: none;
        font-weight: 600;
        margin: 0 0.2em;
      }
    }
  `;

  return (
    <div id="main" ref={appDivRef!}>
      <Show when={showJoinModal()}>
        <JoinChannelModal />
      </Show>
      <AuthModal showing={modalShowing()} />
      <div id="tabs" ref={topBarRef!}>
        <For each={tabs()}>
          {(item, idx) => (
            <Tab
              index={idx()}
              isActive={idx() === currTabIdx()}
              isChannelLive={false}
              channel={item}
            ></Tab>
          )}
        </For>
      </div>
      <For each={tabs()}>
        {(item, idx) => (
          <Chatroom channel={item} isActive={idx() === currTabIdx()}></Chatroom>
        )}
      </For>
      <MessageInput />
    </div>
  );
};

export default Main;
