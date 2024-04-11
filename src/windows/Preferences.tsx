import { Show, Suspense, createResource } from "solid-js";
import { styled } from "solid-styled-components";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { appWindow } from "@tauri-apps/api/window";

const PreferencesDiv = styled.div`
  background-color: ${(props) => props.theme?.colors.bgMain};
  color: ${(props) => props.theme?.colors.fgMain};
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  display: flex;
  & > div {
    height: 100%;
    padding 2em;
    overflow-y: scroll;
    scroll-behavior: smooth;
  }

  & a {
    color: ${(props) => props.theme?.colors.accent2};
    text-decoration: none;
    font-weight: 600;
    margin: 0 0.2em;
  }
`;

const OkButton = styled.button`
  color: ${(props) => props.theme?.colors.fgMain};
  border: 2px solid ${(props) => props.theme?.colors.accent1};
  background-color: ${(props) => props.theme?.colors.accent1}22;
  border-radius: 4px;
  position: absolute;
  right: 1em;
  bottom: 1em;
  min-width: 5em;
  font-weight: bold;
`;

const SidebarDiv = styled.div`
  background-color: ${(props) => props.theme?.colors.bgTern};
  border-right: 1px solid ${(props) => props.theme?.colors.fgMain};
  border-top-right-radius: 1em;
  border-bottom-right-radius: 1em;
  width: 15em;
  padding-top: 2em;
`;

const ClickableP = styled.div`
  font-weight: bold;
  color: ${(props) => props.theme?.colors.accent2};
  cursor: pointer;
  width: 100%;
`;

const FieldsDiv = styled.div``;

const Preferences = () => {
  // ====================================================
  // All the different sections of the preferences window

  let aboutSection: HTMLHeadingElement;

  // ====================================================

  const [metadata] = createResource(async () => {
    return {
      version: await getVersion(),
      tauriVersion: await getTauriVersion(),
    };
  });

  return (
    <PreferencesDiv>
      <SidebarDiv>
        <ClickableP onclick={() => aboutSection.scrollIntoView()}>
          About
        </ClickableP>
      </SidebarDiv>
      <FieldsDiv>
        <hr />
        <h3 ref={aboutSection!}>About</h3>
        <p>
          <b>Charon version: </b>
          <Suspense fallback={<span>Loading version...</span>}>
            <Show when={metadata()}>
              <span>{metadata()?.version}</span>
            </Show>
          </Suspense>
        </p>
        <p>
          <b>Tauri version: </b>
          <Suspense fallback={<span>Loading version...</span>}>
            <Show when={metadata()}>
              <span>{metadata()?.tauriVersion}</span>
            </Show>
          </Suspense>
        </p>

        <b>Links</b>
        <ul>
          <li>
            Source code:{" "}
            <a target="_blank" href="https://github.com/dynamo58/charon">
              github.com/dynamo58/charon
            </a>
          </li>
        </ul>

        <p>
          <b>Credits</b> Special thanks to the following open source projects
          without which this wouldn't be possible!
        </p>

        <ul>
          <li>
            <a target="_blank" href="https://tauri.app/">
              Tauri
            </a>
          </li>
          <li>
            <a target="_blank" href="https://www.solidjs.com/">
              SolidJS
            </a>
          </li>
        </ul>
      </FieldsDiv>
      <OkButton onclick={() => appWindow.close()}>Ok</OkButton>
    </PreferencesDiv>
  );
};

export default Preferences;
