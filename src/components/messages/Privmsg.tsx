import { css } from "solid-styled";
import { IPrivmgPayload } from "../../types";
import Badge from "./Badge";
import { For, onMount } from "solid-js";

const Privmsg = (props: IPrivmgPayload) => {
  let messageRef: HTMLDivElement;

  onMount(() => {
    messageRef.innerHTML = props.message;
  });

  css`
    div.privmsg {
      width: 100%;
      background-color: ${props.is_first_message ? "#00ff0033" : "initial"};
      vertical-align: baseline;
      & * {
        vertical-align: middle;
      }
      margin: 0.2em 0;
      & img {
        margin: 0 0.2em;
      }
    }
  `;

  return (
    <>
      <div class="privmsg">
        <For each={props.badges}>{(item, _idx) => <Badge {...item} />}</For>
        <b
          style={{
            color: props.color,
          }}
        >
          {props.sender_nick}:
        </b>
        <span style="padding-left: 0.3em;" ref={messageRef!}></span>
      </div>
    </>
  );
};

export default Privmsg;
