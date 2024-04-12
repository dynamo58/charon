import { JSX, createEffect } from "solid-js";
import { css } from "solid-styled";
import { useGlobalContext } from "../store";

interface IModalProps {
  children: JSX.Element;
  closeBtnText: string;
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
          {props.children}
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
