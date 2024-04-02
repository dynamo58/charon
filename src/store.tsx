import {
	Accessor,
	Setter,
	createContext,
	useContext,
	createSignal,
	onMount,
} from "solid-js";


const DEFAULT_SETTINGS = {
  tabs: ["pepega00000", "gkey"],
  currTabIdx: 0
}

interface ContextProps {
	tabs: Accessor<string[]>;
	setTabs: Setter<string[]>;
	currTabIdx: Accessor<number>;
	setCurrTabIdx: Setter<number>;
}

const GlobalContext = createContext<ContextProps>();

export function GlobalContextProvider(props: any) {
	const [tabs, setTabs] = createSignal<string[]>(DEFAULT_SETTINGS.tabs);
	const [currTabIdx, setCurrTabIdx] = createSignal<number>(DEFAULT_SETTINGS.currTabIdx);

	onMount(async () => {
    // TODO: fetch config
	});

	return (
		<GlobalContext.Provider
			value={{
				tabs,
				setTabs,
				currTabIdx,
				setCurrTabIdx,
			}}
		>
			{props.children}
		</GlobalContext.Provider>
	);
}

export const useGlobalContext = () => useContext(GlobalContext)!;
