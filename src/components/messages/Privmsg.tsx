import { css } from "solid-styled";
import { IPrivmgPayload } from "../../types";
import Badge from "./Badge";
import { For, onMount } from "solid-js";
import { useGlobalContext } from "../../store";

const Privmsg = (props: IPrivmgPayload) => {
  const { theme } = useGlobalContext();
  let messageRef: HTMLDivElement;

  onMount(() => {
    messageRef.innerHTML = props.message;
  });

  css`
    div.privmsg {
      width: 100%;
      background-color: ${props.is_first_message ? "#00ff0033" : "initial"};
      vertical-align: baseline;
      padding: ${`${0.3 * theme().fonts.scale}em 0`};
      /*align-content: center;*/
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
