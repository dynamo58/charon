/* @refresh reload */
import { render } from "solid-js/web";

import { ThemeProvider, DefaultTheme } from "solid-styled-components";
import App from "./App";
import { GlobalContextProvider } from "./store";
import { createGlobalStyles } from "solid-styled-components";

const GlobalStyles = () => {
  const Styles = createGlobalStyles`
    :root {
      font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 24px;
      font-weight: 400;

      --bg-main: #121212;
      --bg-secondary: #202020;
      --fg-main: #fff8e0;

      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;

      box-sizing: border-box;
    }

    html,
    body {
      padding: 0;
      margin: 0;
      color: var(--fg-main);
      background-color: var(--bg-main);
      overflow: hidden;
    }

    ::-webkit-scrollbar {
      width: 10px;
      height: 10px;
      transition: all 0.5 ease
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(90, 90, 90, 50);
    }


    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0);
    }

    #send-msg-field {
      height: 5vh;
    }

    input {
      width: 100%;
      height: 100%;
      background: var(--bg-main);
      color: var(--fg-main);
      border: none;
    }

    input:focus {
      outline: none;
    }

  `;
  return <Styles />;
};

import "solid-styled-components";
declare module "solid-styled-components" {
  export interface DefaultTheme {
    colors: {
      fgMain: string;

      bgMain: string;
      bgSec: string;
      bgTern: string;

      accent1: string;
      accent2: string;

      border: string;
    };
  }
}

const theme: DefaultTheme = {
  colors: {
    fgMain: "#fff8e0",

    bgMain: "#121212",
    bgSec: "#202020",
    bgTern: "#303030",

    accent1: "#ffee00",
    accent2: "#00f2ff",

    border: "#505050",
  },
};

import KeyboardManager from "./keyboard-manager";
render(
  () => (
    <>
      <GlobalContextProvider>
        <GlobalStyles />
        <KeyboardManager />
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </GlobalContextProvider>
    </>
  ),
  document.getElementById("root") as HTMLElement
);
