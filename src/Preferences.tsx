import { styled } from "solid-styled-components";

const PreferencesDiv = styled.div`
  background-color: ${(props) => props.theme?.colors.bgMain};
  color: ${(props) => props.theme?.colors.fgMain};
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
`;

function Preferences() {
  return (
    <PreferencesDiv>
      <div style="text-align: center;width: 100%">BUH!</div>
    </PreferencesDiv>
  );
}

export default Preferences;
