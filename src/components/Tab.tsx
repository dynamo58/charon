import { JSXElement, createSignal, onMount } from "solid-js";
import { styled } from "solid-styled-components";
import { useGlobalContext } from "../store";

const TabDiv = styled.span<{isActive: boolean, isChannelLive: boolean}>`
  border-bottom: 2px solid ${props => props.isChannelLive ? "#fff" : props.theme?.colors.border};
  border-radius: 0.25em;
  background-color: ${props => props.isActive ? props.theme?.colors.bgTern : props.theme?.colors.bgSec };
  font-size: 0.8em;
  padding: 3px;
  height:100%;
  display: inline-block;
  margin-left: 5px;
  cursor: pointer;
`

interface ITabProps {
  children?: JSXElement,
  isChannelLive: boolean,
  isActive: boolean,
  index: number
}

const Tab = (props: ITabProps) => {
  const { setCurrTabIdx } = useGlobalContext();
  const index = props.index;
  
  return (<>
    <TabDiv
      isChannelLive={props.isChannelLive}
      isActive={props.isActive}
      onclick={() => {setCurrTabIdx(index)}}
    >{props.children}</TabDiv>
  </>)
}

export default Tab;
