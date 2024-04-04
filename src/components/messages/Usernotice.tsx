import { styled } from "solid-styled-components";
import { IUsernoticePayload } from "../../types";
import { onMount } from "solid-js";

const UsernoticeDiv = styled.div`
  width: 100%;
  background-color: #9514cc33;
`;

const EventDiv = styled.div`
  color: ${(props) => props.theme?.colors.fgAlt};
  font-size: ${(props) => props.theme?.fontSizes.small};
`;

const Usernotice = (props: IUsernoticePayload) => {
  onMount(() => {
    console.log("buh", props);
  });

  return (
    <>
      <UsernoticeDiv>
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
