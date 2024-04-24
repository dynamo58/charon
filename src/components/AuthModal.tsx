import { createEffect } from "solid-js";
import { css } from "solid-styled";
import { useGlobalContext } from "../store";
import { TWITCH_AUTH_URL } from "../constants";

interface IModalProps {
  showing: boolean;
}

const AuthModal = (props: IModalProps) => {
  const { theme } = useGlobalContext();

  let d: HTMLDialogElement;

  createEffect(() => {
    if (props.showing === true) d.showModal();
    else d.close();
  });

  css`
    #authModalDialog {
      color: ${theme().colors.fgMain};
      background-color: ${theme().colors.bgTern};
      border: 2px solid ${theme().colors.fgMain};
      border-radius: 1em;
      padding: 1em;
    }
  `;

  return (
    <>
      <dialog id="authModalDialog" ref={d!}>
        <form method="dialog">
          <p style="line-height: 1.4em">
            Click{" "}
            <a target="_blank" href={TWITCH_AUTH_URL}>
              here
            </a>{" "}
            to authentificate using your Twitch account.
          </p>
          <br />
          <p>
            This popup will close automatically when authentification is
            successfull and everything gets set up. The "set up" process
            shouldn't take more than a couple of seconds.
          </p>
        </form>
      </dialog>
    </>
  );
};

export default AuthModal;
