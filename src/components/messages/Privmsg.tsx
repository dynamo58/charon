import { styled } from "solid-styled-components";
import { IPrivmgPayload } from "../../types";
import Badge from "./Badge";
import { For, onMount } from "solid-js";

const PrivmsgDiv = styled.div<{ is_first: boolean }>`
  width: 100%;
  background-color: ${(props) => (props.is_first ? "#00ff0033" : "initial")};
  vertical-align: baseline;
  & > * {
    display: inline-block;
    vertical-align: middle;
  }
`;

const Privmsg = (props: IPrivmgPayload) => {
  let messageRef: HTMLSpanElement;

  onMount(() => {
    messageRef.innerHTML = props.message;
  });

  return (
    <>
      <PrivmsgDiv is_first={props.is_first_message}>
        <For each={props.badges}>{(item, _idx) => <Badge {...item} />}</For>
        <b
          style={{
            color: props.color,
          }}
        >
          {props.sender_nick}:&nbsp;
        </b>
        <span ref={messageRef!}></span>
      </PrivmsgDiv>
    </>
  );
};

export default Privmsg;
