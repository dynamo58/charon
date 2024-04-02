import { useGlobalContext } from "./store";

const KeyboardManager = () => {
  const { openTab } = useGlobalContext();

  window.addEventListener("keydown", async (e) => {
    if (e.ctrlKey && e.key === "n") {
      const new_tab_label = prompt("New chanel:");
      if (new_tab_label !== null) {
        openTab(new_tab_label);
      }
    }
  });
  return <></>;
};

export default KeyboardManager;
