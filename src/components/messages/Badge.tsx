import { styled } from "solid-styled-components";
import { IBadgeInfo } from "../../types";

const BadgeImg = styled.img<{ is_mod_badge: boolean }>`
  height: ${(props) => (props.is_mod_badge ? "0.9em" : "1em")} !important;
  width: ${(props) => (props.is_mod_badge ? "0.9em" : "1em")} !important;
  margin-left: 0.2em;
  margin-right: 0.2em;
  margin-bottom: ${(props) => (props.is_mod_badge ? "0.1em" : "0")} !important;
  background-color: ${(props) => (props.is_mod_badge ? "#0d0" : "initial")};
`;

const Badge = (props: IBadgeInfo) => {
  return (
    <>
      <BadgeImg
        is_mod_badge={props.title === "Moderator"}
        src={props.image_url_base + "1"}
      />
    </>
  );
};

export default Badge;
