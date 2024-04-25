import { css } from "solid-styled";
import { IPrivmgPayload } from "../../types";
import Badge from "./Badge";
import { For, onMount } from "solid-js";
import { useGlobalContext } from "../../store";

const Privmsg = (props: IPrivmgPayload) => {
  // TODO: add an option whether or not to stack these
  const NotificationSound = new Audio("/sounds/notification.mp3");
  NotificationSound.volume = 0.5;
  const { theme, connInfo } = useGlobalContext();
  let messageRef: HTMLDivElement;

  onMount(() => {
    messageRef.innerHTML = props.message;

    if (
      connInfo() &&
      props.sender_nick.toLowerCase() !== connInfo() &&
      props.message.toLowerCase().includes(connInfo()!)
    )
      NotificationSound.play();
  });

  css`
    div.privmsg {
      width: 100%;
      background-color: ${props.is_first_message ? "#00ff0033" : "initial"};
      vertical-align: baseline;
      padding: ${`${0.3 * theme().fonts.scale}em 0`};
    }

    div.privmsg > * {
      display: inline-block;
    }

    * {
      font-size: ${`${theme().fonts.scale.toString()}em !important`};
    }

    span {
      margin-left: 0.1em;
    }

    p {
      margin: 0 !important;
      line-height: ${`${0.1 * theme().fonts.scale}em 0`};
    }

    @global {
      .emote {
        height: 2em !important;
        margin: 0 0.2em;
        display: inline-block;
      }

      .inline-link {
        margin: 0 0.2em;
        color: ${theme().colors.accent1};
      }
    }
  `;

  return (
    <>
      <div class="privmsg">
        <p>
          <For each={props.badges}>{(item, _idx) => <Badge {...item} />}</For>
          <span
            style={{
              color: props.color,
              "font-weight": "bold",
            }}
          >
            {props.sender_nick}:
          </span>
          <span style="padding-left: 0.2em;" ref={messageRef!}></span>
        </p>
      </div>
    </>
  );
};

export default Privmsg;
