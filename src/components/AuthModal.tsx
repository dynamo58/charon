import { JSX, createEffect } from "solid-js";
import { styled } from "solid-styled-components";

const ModalDialog = styled.dialog`
  color: ${(props) => props.theme?.colors.fgMain};
  background-color: ${(props) => props.theme?.colors.bgTern};
  border: 2px solid ${(props) => props.theme?.colors.fgMain};
  border-radius: 1em;
  padding: 1em;
`;

interface IModalProps {
  children: JSX.Element;
  closeBtnText: string;
  showing: boolean;
}

const AuthModal = (props: IModalProps) => {
  let d: HTMLDialogElement;

  createEffect(() => {
    if (props.showing === true) d.showModal();
    else d.close();
  });

  return (
    <>
      <ModalDialog id="favDialog" ref={d!}>
        <form method="dialog">
          {props.children}
          <br />
          <p>
            This popup will close automatically when authentification is
            successfull and everything gets set up. The "set up" process
            shouldn't take more than a couple of seconds.
          </p>
        </form>
      </ModalDialog>
    </>
  );
};

export default AuthModal;
