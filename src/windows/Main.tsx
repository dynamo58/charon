import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { For } from "solid-js";
import Chatroom from "../components/Chatroom";

import Tab from "../components/Tab";
import { useGlobalContext } from "../store";
import AuthModal from "../components/AuthModal";
import { css } from "solid-styled";
import MessageInput from "../components/MessageInput";

const Main = () => {
  const { theme } = useGlobalContext();
  const { tabs, currTabIdx } = useGlobalContext();

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
      <AuthModal showing={modalShowing()} />
      <div id="tabs" ref={topBarRef!}>
        <For each={tabs()}>
          {(item, idx) => (
            <Tab
              index={idx()}
              isActive={idx() === currTabIdx()}
              isChannelLive={false}
              channelName={item}
            ></Tab>
          )}
        </For>
      </div>
      <For each={tabs()}>
        {(item, idx) => (
          <Chatroom
            channelName={item}
            isActive={idx() === currTabIdx()}
          ></Chatroom>
        )}
      </For>
      <MessageInput />
    </div>
  );
};

export default Main;
