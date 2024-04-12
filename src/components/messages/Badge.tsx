import { css } from "solid-styled";
import { IBadgeInfo } from "../../types";

const Badge = (props: IBadgeInfo) => {
  css`
    img.badge {
      height: ${props.title === "Moderator" ? "0.95em" : "1em"} !important;
      width: ${props.title === "Moderator" ? "0.95em" : "1em"} !important;
      margin-left: 0.1em;
      margin-right: 0.1em;
      background-color: ${props.title === "Moderator" ? "#0d0" : "initial"};
    }
  `;

  return (
    <>
      <img class="badge" src={props.image_url_base + "1"} />
    </>
  );
};

export default Badge;
