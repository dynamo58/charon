import { css } from "solid-styled";
import { For, createEffect, createSignal } from "solid-js";
import { Emote } from "../types";
import { useGlobalContext } from "../store";
import { Keybind, useKeybindManager } from "../KeybindManager";

interface EmoteHinterProps {
  emotes: Emote[];
}

const EmoteHinter = (props: EmoteHinterProps) => {
  const { theme } = useGlobalContext();
  const { registerKeybind } = useKeybindManager();
  const [selIdx, setSelIdx] = createSignal<number>(0);

  css`
    .hinter {
      display: flex;
      width: 100%;
      position: absolute;
      overflow-x: scroll;
      flex-direction: row;
      gap: 1em;
      background-color: ${theme().colors.bgSec};
      padding: 1em;
      z-index: 2;
    }

    img {
      height: 1.5em !important;
      display: inline-block;
    }

    span {
      font-size: 0.8em;
      max-width: 30px !important;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .hint {
      display: inline-block;
      cursor: pointer;
    }
  `;

  const handleHintClick = (emote_code: string) => {
    window.dispatchEvent(
      new CustomEvent<string>("emoteChosen", {
        detail: emote_code,
      })
    );
  };

  registerKeybind(
    new Keybind(
      "Iterate selected emote",
      (e) => e.key === "Tab",
      () => {
        setSelIdx((selIdx() + 1) % props.emotes.length);
      }
    )
  );

  registerKeybind(
    new Keybind(
      "Choose emote",
      (e) => e.key === "Enter",
      () => {
        if (props.emotes.length > 0) {
          handleHintClick(props.emotes[selIdx()].code);
        }
      },
      true
    )
  );

  createEffect(() => {
    console.log(selIdx(), props.emotes[selIdx()]);
  });

  return (
    <div class="hinter">
      <For each={props.emotes}>
        {(e, idx) => (
          <div
            style={{
              "background-color":
                idx() === selIdx()
                  ? `${theme().colors.accent1}66`
                  : "#00000000",
            }}
            class="hint"
            onclick={() => handleHintClick(e.code)}
          >
            <img src={e.url_3x} alt="" />
            <span>{e.code}</span>
          </div>
        )}
      </For>
    </div>
  );
};

export default EmoteHinter;
