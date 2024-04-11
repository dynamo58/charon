import { createSignal, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { For } from "solid-js";
import Chatroom from "../components/Chatroom";

import Tab from "../components/Tab";
import { useGlobalContext } from "../store";
import { styled } from "solid-styled-components";
import AuthModal from "../components/AuthModal";
import { TWITCH_AUTH_URL } from "../constants";
import { Keybind, useKeybindManager } from "../KeybindManager";

const MainDiv = styled.div`
  background-color: ${(props) => props.theme?.colors.bgMain};
  color: ${(props) => props.theme?.colors.fgMain};
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  & a {
    color: ${(props) => props.theme?.colors.accent2};
    text-decoration: none;
    font-weight: 600;
    margin: 0 0.2em;
  }

  & input {
    width: 100vw;
    height: 3em;
    border: none;
    background-color: ${(props) => props.theme?.colors.bgMain};
    color: ${(props) => props.theme?.colors.fgMain};
    padding: 0 0.5em;
    overflow-wrap: break-word;
    overflow: hidden;
    display: block;
  }

  & input:focus {
    outline: none;
  }
`;

const TabDiv = styled.div``;
const MessageDiv = styled.div``;

const Main = () => {
  let topBarRef: HTMLDivElement;
  const { tabs, currTabIdx } = useGlobalContext();
  const { registerKeybind } = useKeybindManager();

  let messageInputRef: HTMLInputElement;
  let [message, setMessage] = createSignal<string>("");

  const handleMessageSubmission = async (e: KeyboardEvent) => {
    if (e.key !== "Enter" || message() === "") return;

    console.log(
      await invoke("send_message", {
        message: message(),
        channelName: tabs()[currTabIdx()],
      })
    );

    if (!e.ctrlKey) messageInputRef.value = "";
  };

  const [modalShowing, setModalShowing] = createSignal<boolean>(false);

  let appDivRef: HTMLDivElement;

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

    // fallback to random chars activating the message input
    registerKeybind(
      new Keybind(
        "focus chat on random keypresses",
        (e) => /[a-zA-Z]/.test(e.key) && !e.ctrlKey && !e.shiftKey && !e.altKey,
        (_) => {
          messageInputRef.focus();
        }
      )
    );
  });

  return (
    <MainDiv ref={appDivRef!}>
      <AuthModal closeBtnText={""} showing={modalShowing()}>
        <p style="line-height: 1.4em">
          Click{" "}
          <a target="_blank" href={TWITCH_AUTH_URL}>
            here
          </a>{" "}
          to authentificate using your Twitch account.
        </p>
      </AuthModal>
      <TabDiv ref={topBarRef!}>
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
      </TabDiv>
      <For each={tabs()}>
        {(item, idx) => (
          <Chatroom
            channelName={item}
            isActive={idx() === currTabIdx()}
          ></Chatroom>
        )}
      </For>
      <MessageDiv>
        <input
          type="text"
          ref={messageInputRef!}
          onChange={(val) => setMessage((_) => val.target.value)}
          onkeyup={handleMessageSubmission}
        />
      </MessageDiv>
    </MainDiv>
  );
};

export default Main;
