import { css } from "solid-styled";
import { IUsernoticePayload } from "../../types";
import { For } from "solid-js";
import Badge from "./Badge";
import { useGlobalContext } from "../../store";

const Usernotice = (props: IUsernoticePayload) => {
  const { theme } = useGlobalContext();

  css`
    div.usernotice {
      width: 100%;
      background-color: #9514cc33;
      & > * {
        display: inline-block;
        vertical-align: middle;
      }
    }

    div.event {
      color: ${theme().colors.fgAlt};
      font-size: ${theme().fontSizes.small};
    }
  `;

  return (
    <>
      <div class="usernotice">
        <For each={props.badges}>{(item, _idx) => <Badge {...item} />}</For>
        <b
          style={{
            color: props.color,
          }}
        >
          {props.sender_nick}:{" "}
        </b>
        <span>{props.message}</span>
        <br />
        <div class="event">
          ({props.event_name}) {props.system_message}
        </div>
      </div>
    </>
  );
};

export default Usernotice;
