import { JSXElement, createSignal, onMount } from "solid-js";
import { styled } from "solid-styled-components";
import { useGlobalContext } from "../store";

const TabDiv = styled.span<{ isActive: boolean; isChannelLive: boolean }>`
  border-bottom: 2px solid
    ${(props) => (props.isChannelLive ? "#fff" : props.theme?.colors.border)};
  border-radius: 0.25em;
  background-color: ${(props) =>
    props.isActive ? props.theme?.colors.bgTern : props.theme?.colors.bgSec};
  font-size: 0.8em;
  padding: 3px;
  height: 100%;
  display: inline-block;
  margin-left: 5px;
  cursor: pointer;
`;

const CloseBtnSpan = styled.span`
  color: ${(props) => props.theme?.colors.accent1};
  margin-left: 4px;
  padding: 3px;
  border-radius: 3px;
  transition: all 0.2s ease;
  &:hover {
    background-color: ${(props) => props.theme?.colors.bgMain};
  }
`;

interface ITabProps {
  children?: JSXElement;
  isChannelLive: boolean;
  isActive: boolean;
  index: number;
  channelName: string;
}

const Tab = (props: ITabProps) => {
  const { setCurrTabIdx, closeTab, tabs } = useGlobalContext();
  const index = props.index;

  return (
    <>
      <TabDiv
        isChannelLive={props.isChannelLive}
        isActive={props.isActive}
        onclick={() => {
          setCurrTabIdx(index);
        }}
      >
        {props.channelName}
        <CloseBtnSpan
          onclick={() => {
            closeTab(tabs()[index]);
          }}
        >
          ×
        </CloseBtnSpan>
      </TabDiv>
    </>
  );
};

export default Tab;
