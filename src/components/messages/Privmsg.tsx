import { styled } from "solid-styled-components";
import { IPrivmgPayload } from "../../types";
import Badge from "./Badge";
import { For } from "solid-js";

const PrivmsgDiv = styled.div<{ is_first: boolean }>`
  width: 100%;
  background-color: ${(props) => (props.is_first ? "#00ff0033" : "initial")};
  vertical-align: baseline;
`;

const Privmsg = (props: IPrivmgPayload) => {
  return (
    <>
      <PrivmsgDiv is_first={props.is_first_message}>
        <For each={props.badges}>{(item, _idx) => <Badge {...item} />}</For>
        <b
          style={{
            color: props.color,
          }}
        >
          {props.sender_nick}:{" "}
        </b>
        <span>{props.message}</span>
      </PrivmsgDiv>
    </>
  );
};

export default Privmsg;
