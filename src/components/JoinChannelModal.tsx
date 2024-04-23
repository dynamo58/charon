import { css } from "solid-styled";
import { useGlobalContext } from "../store";
import { createSignal, onMount } from "solid-js";
import { Platform } from "../types";

const JoinChannelModal = () => {
  const { theme, openTab } = useGlobalContext();

  const [channel, setChannel] = createSignal<string>("");

  let input: HTMLInputElement;

  const handleJoinAttempt = async () => {
    openTab(channel(), Platform.Twitch);
    window.dispatchEvent(new Event("close:join:channel:modal"));
  };

  onMount(() => {
    input.focus();
  });

  css`
    .modal {
      display: block;
      position: fixed;
      z-index: 1;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: #000000cc;
    }

    .modal-content {
      margin: 15% auto;
      padding: 20px;
      width: 80%;
      text-align: center;
      border: 2px solid #fff;
      border-radius: 2em;
      background: ${`linear-gradient(
        135deg,
        ${theme().colors.bgSec}44 0%,
        ${theme().colors.accent1}88 100%
      )`};
    }

    .close {
      color: #aaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
    }

    .close:hover,
    .close:focus {
      color: ${theme().colors.accent1};
      text-decoration: none;
      cursor: pointer;
    }

    input {
      padding: 0.7em;
      background-color: ${theme().colors.bgTern};
      color: ${theme().colors.fgMain};
      border: 1px solid #fff;
    }

    button {
      background-color: ${`${theme().colors.accent2}66`};
      border: 2px solid ${theme().colors.accent2};
      color: ${theme().colors.fgMain};
      padding: 0.4em 2em;
      border-radius: 10px;
    }
  `;

  return (
    <>
      <div id="myModal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Join a channel</h2>

          <input
            ref={input!}
            oninput={(e) => setChannel(e.target.value)}
            onkeydown={(e) => {
              if (e.key === "Enter") handleJoinAttempt();
            }}
            type="text"
            placeholder="Channel name"
          />
          <br />
          <br />
          <button onclick={handleJoinAttempt}>Join</button>
        </div>
      </div>
    </>
  );
};

export default JoinChannelModal;
