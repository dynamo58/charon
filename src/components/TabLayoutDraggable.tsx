import { For, JSXElement } from "solid-js";
import {
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
  closestCenter,
  createSortable,
} from "@thisbeyond/solid-dnd";
import { useGlobalContext } from "../store";
import { Tab as TabData } from "../types";
import Tab from "./Tab";

const TabLayoutDraggable = () => {
  const { tabs, setNewTabs, currTabIdx } = useGlobalContext();

  // adapted from
  // https://github.com/cohenerickson/Velocity/blob/7ba21b7f80d5a822ff6eab139e66dabb26183d7c/src/components/Tabs.tsx
  const onDragEnd = ({ draggable, droppable }: any) => {
    draggable.node.classList.remove("z-20");
    if (draggable && droppable) {
      const currentItems = tabs();
      const fromIndex = currentItems.findIndex(
        (tab: TabData) => tab.uuid === draggable.id
      );
      const toIndex = currentItems.findIndex(
        (tab: TabData) => tab.uuid === droppable.id
      );
      if (fromIndex !== toIndex) {
        const updatedItems = currentItems.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
        setNewTabs(updatedItems, toIndex);
      }
    }
  };

  const onDragStart = ({}: any) => {};

  return (
    <DragDropProvider
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      collisionDetector={closestCenter}
    >
      <DragDropSensors />
      <SortableProvider ids={tabs().map((x) => x.uuid)}>
        <For each={tabs()}>
          {(tab: TabData, idx): JSXElement => {
            const sortable = createSortable(tab.uuid);
            return (
              <Tab
                sortable={sortable}
                index={idx()}
                isActive={idx() === currTabIdx()}
                isChannelLive={false}
                channel={tab}
              />
            );
          }}
        </For>
      </SortableProvider>
    </DragDropProvider>
  );
};

export default TabLayoutDraggable;
