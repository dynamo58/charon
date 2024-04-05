import { styled } from "solid-styled-components";
import { IUsernoticePayload } from "../../types";
import { For } from "solid-js";
import Badge from "./Badge";

const UsernoticeDiv = styled.div`
  width: 100%;
  background-color: #9514cc33;
`;

const EventDiv = styled.div`
  color: ${(props) => props.theme?.colors.fgAlt};
  font-size: ${(props) => props.theme?.fontSizes.small};
`;

const Usernotice = (props: IUsernoticePayload) => {
  return (
    <>
      <UsernoticeDiv>
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
        <EventDiv>
          ({props.event_name}) {props.system_message}
        </EventDiv>
      </UsernoticeDiv>
    </>
  );
};

export default Usernotice;
