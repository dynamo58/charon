/* @refresh reload */
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { GlobalContextProvider, useGlobalContext } from "./store";
import { KeybindManager } from "./KeybindManager";
import Main from "./windows/Main";
import { css } from "solid-styled";

const Preferences = lazy(() => import("./windows/Preferences"));

const GlobalStyles = () => {
  const { theme } = useGlobalContext();

  css`
    @global {
      :root {
        font-size: 16px;
        line-height: 16px;
        font-weight: 400;
        font-family: ${theme().fonts.ui};

        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        -webkit-text-size-adjust: 100%;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        padding: 0;
        margin: 0;
        overflow: hidden;
      }

      /*
        this has to be here due to the whole msg injection thing
      */
      .emote {
        height: 2em !important;
        display: inline-block;
      }

      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
        transition: all 0.5 ease;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(90, 90, 90, 50);
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0);
      }

      @font-face {
        font-family: "Arial";
        src: url("/assets/arial.ttf") format("truetype"),
          url("/fonts/ariali.ttf") format("truetype"),
          url("/fonts/arialb.ttf") format("truetype"),
          url("/fonts/arialbi.ttf") format("truetype");
      }
    }
  `;
  return <></>;
};

render(
  () => (
    <>
      <GlobalContextProvider>
        <GlobalStyles />
        <KeybindManager>
          <Router>
            <Route path="/" component={Main} />
            <Route path="/preferences" component={Preferences} />
          </Router>
        </KeybindManager>
      </GlobalContextProvider>
    </>
  ),
  document.getElementById("root") as HTMLElement
);
