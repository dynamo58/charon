import { styled } from "solid-styled-components";
import { IPrivmgPayload } from "../../types";

const PrivmsgDiv = styled.div<{ is_first: boolean }>`
  width: 100%;
  background-color: ${(props) => (props.is_first ? "#00ff0033" : "initial")};
`;

const Privmsg = (props: IPrivmgPayload) => {
  return (
    <>
      <PrivmsgDiv is_first={props.is_first_message}>
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
