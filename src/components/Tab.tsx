import { css } from "solid-styled";
import { useGlobalContext } from "../store";
import { Tab as TabData } from "../types";

interface ITabProps {
  isChannelLive: boolean;
  isActive: boolean;
  index: number;
  channel: TabData;
  sortable: any;
}

const Tab = (props: ITabProps) => {
  // @ts-ignore
  const { sortable } = props;
  const { theme } = useGlobalContext();
  const { setCurrTabIdx, closeTab } = useGlobalContext();

  css`
    .tab {
      border-bottom: 2px solid
        ${props.isChannelLive ? "#fff" : theme().colors.border};
      border-radius: 0.25em;
      background-color: ${props.isActive
        ? theme().colors.bgTern
        : theme().colors.bgSec};
      font-size: 1em;

      padding: 0.2em;
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
    <div
      // @ts-ignore
      use:sortable
      class="tab"
      onclick={() => {
        setCurrTabIdx(props.index);
      }}
    >
      {props.channel.label}
      <span
        class="close-btn"
        onclick={() => {
          closeTab(props.index);
        }}
      >
        ×
      </span>
    </div>
  );
};

export default Tab;
