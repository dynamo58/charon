import { JSXElement } from "solid-js";
import { css } from "solid-styled";
import { useGlobalContext } from "../store";

interface ITabProps {
  children?: JSXElement;
  isChannelLive: boolean;
  isActive: boolean;
  index: number;
  channelName: string;
}

const Tab = (props: ITabProps) => {
  const { theme } = useGlobalContext();
  const { setCurrTabIdx, closeTab, tabs } = useGlobalContext();
  const index = props.index;

  css`
    .tab {
      border-bottom: 2px solid
        ${props.isChannelLive ? "#fff" : theme().colors.border};
      border-radius: 0.25em;
      background-color: ${props.isActive
        ? theme().colors.bgTern
        : theme().colors.bgSec};
      font-size: 0.8em;
      padding: 0 3px;
      display: inline-block;
      margin-left: 5px;
      cursor: pointer;
    }

    .close-btn {
      color: ${theme().colors.accent1};
      margin-left: 4px;
      padding: 3px;
      border-radius: 3px;
      transition: all 0.2s ease;
      &:hover {
        background-color: ${theme().colors.bgMain};
      }
    }
  `;

  return (
    <>
      <div
        class="tab"
        onclick={() => {
          setCurrTabIdx(index);
        }}
      >
        {props.channelName}
        <span
          class="close-btn"
          onclick={() => {
            closeTab(tabs()[index]);
          }}
        >
          ×
        </span>
      </div>
    </>
  );
};

export default Tab;
