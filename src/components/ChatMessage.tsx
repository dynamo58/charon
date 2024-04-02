import { IRecievedMessage } from "../types";

const ChatMessage = (props: IRecievedMessage) => {
  return (<>
    <div style="width:100%;">
      <b style={{
        color: props.color
      }}>{props.sender_nick}: </b><span>{props.message}</span>
    </div>
  </>)
}

export default ChatMessage;
