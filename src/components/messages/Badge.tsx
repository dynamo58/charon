import { styled } from "solid-styled-components";
import { IBadgeInfo } from "../../types";

const BadgeImg = styled.img<{ is_mod_badge: boolean }>`
  height: ${(props) => (props.is_mod_badge ? "0.95em" : "1em")} !important;
  width: ${(props) => (props.is_mod_badge ? "0.95em" : "1em")} !important;
  margin-left: 0.1em;
  margin-right: 0.1em;
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
