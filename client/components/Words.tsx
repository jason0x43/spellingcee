import { classNames } from "../util.ts";
import { React } from "../deps.ts";
import { useVerticalMediaQuery } from "../hooks/mod.ts";
import { isPangram } from "../../shared/util.ts";
import Button from "./Button.tsx";
import Modal from "./Modal.tsx";
import Spinner from "./Spinner.tsx";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import { selectUser, signout } from "../store/user.ts";
import { selectGame, selectWords } from "../store/game.ts";
import {
  clearDefinition,
  getDefinition,
  selectDefinition,
  selectWordListExpanded,
  setWordListExpanded,
} from "../store/ui.ts";

const { useRef, useState } = React;

const Words: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const words = useAppSelector(selectWords);
  const game = useAppSelector(selectGame);
  const definition = useAppSelector(selectDefinition);
  const wordListExpanded = useAppSelector(selectWordListExpanded);
  const [alphabetical, setAlphabetical] = useState(false);
  const isVertical = useVerticalMediaQuery();
  const listRef = useRef<HTMLDivElement>(null);

  const displayWords = alphabetical && (!isVertical || wordListExpanded)
    ? Object.keys(words).sort()
    : Object.keys(words).sort(
      (a, b) => words[b].addedAt - words[a].addedAt,
    );

  return (
    <>
      <div
        className={classNames({
          Words: true,
          "Words-collapsed": !wordListExpanded,
          "Words-expanded": wordListExpanded,
        })}
        ref={listRef}
      >
        <div className="Words-list-wrapper">
          <ul
            className={classNames({
              "Words-list": true,
              "Words-list-clickable": true,
            })}
          >
            {displayWords.map((word, i) => {
              const className = classNames({
                "Words-word": true,
                "Words-word-pangram": isPangram(word),
                "Words-word-own": words[word].userId === user?.id,
              });
              return (
                <li
                  key={i}
                  className={className}
                  onClick={() => dispatch(getDefinition(word))}
                >
                  {word}
                </li>
              );
            })}
          </ul>
        </div>
        <Button
          className="Words-show-list"
          size="small"
          onClick={() => dispatch(setWordListExpanded(!wordListExpanded))}
        >
          ▼
        </Button>
        <div className="Words-controls">
          <span className="Words-metrics">
            {Object.keys(words).length} / {game?.maxWords} words
          </span>
          <Button
            size="small"
            onClick={() => {
              setAlphabetical(!alphabetical);
            }}
          >
            {alphabetical ? "Time" : "Alpha"}
          </Button>
        </div>

        {definition && (
          <Modal onHide={() => dispatch(clearDefinition())}>
            {definition.definition
              ? (
                <div className="Definition">
                  <div className="Definition-word">{definition.word}</div>
                  <ol className="Definition-definitions">
                    {definition.definition.map((def, i) => (
                      <li className="Definition-definition" key={i}>
                        {def}
                      </li>
                    ))}
                  </ol>
                </div>
              )
              : <Spinner />}
          </Modal>
        )}
      </div>
    </>
  );
};

export default Words;
