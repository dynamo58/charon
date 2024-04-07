/* @refresh reload */
import { render } from "solid-js/web";

import { ThemeProvider, DefaultTheme } from "solid-styled-components";
import App from "./App";
import { GlobalContextProvider } from "./store";
import { createGlobalStyles } from "solid-styled-components";

import "solid-styled-components";
declare module "solid-styled-components" {
  export interface DefaultTheme {
    colors: {
      fgMain: string;
      fgAlt: string;

      bgMain: string;
      bgSec: string;
      bgTern: string;

      accent1: string;
      accent2: string;

      border: string;
    };

    fontSizes: {
      small: string;
    };
  }
}

const theme: DefaultTheme = {
  colors: {
    fgMain: "#fff8e0",
    fgAlt: "#ccc6af",

    bgMain: "#202020",
    bgSec: "#121212",
    bgTern: "#303030",

    accent1: "#ffee00",
    accent2: "#00f2ff",

    border: "#505050",
  },
  fontSizes: {
    small: "0.7em",
  },
};

const GlobalStyles = () => {
  const Styles = createGlobalStyles`
    :root {
      font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
      font-size: 16px;
      line-height: 16px;
      font-weight: 400;

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
      overflow: hidden;
    }

    p {
      margin: 0.2em 0;
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
  `;
  return <Styles />;
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
