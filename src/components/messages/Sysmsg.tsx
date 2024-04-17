import { css } from "solid-styled";
import { useGlobalContext } from "../../store";

export interface ISysmsgPayload {
  message: string;
}

const Sysmsg = (props: ISysmsgPayload) => {
  const { theme } = useGlobalContext();

  css`
    div.system-message {
      width: 100%;
      color: #ddd;
      vertical-align: baseline;
      margin: ${`${0.3 * theme().fonts.scale}em 0`};
    }
  `;

  return (
    <>
      <div class="system-message">🛠️ {props.message}</div>
    </>
  );
};

export default Sysmsg;
