import { classNames } from "../util.ts";
import { React, useCallback, useEffect, useRef, useState } from "../deps.ts";
import { User } from "../../types.ts";
import { Words } from "../types.ts";
import { useVerticalMediaQuery } from "../hooks/mod.ts";
import { isPangram } from "../../shared/util.ts";
import Button from "./Button.tsx";
import Modal from "./Modal.tsx";
import Spinner from "./Spinner.tsx";

type DefinedWord = {
  word: string;
  definition: string[] | undefined;
};

export interface WordsProps {
  words: Words;
  totalWords: number;
  wordListExpanded?: boolean;
  setWordListExpanded: (expanded: boolean) => void;
  user: User;
  getDefinition: (word: string) => Promise<string[] | undefined>;
}

const Words: React.FC<WordsProps> = (props) => {
  const {
    getDefinition,
    wordListExpanded,
    user,
    words,
    totalWords,
    setWordListExpanded,
  } = props;
  const [alphabetical, setAlphabetical] = useState(false);
  const [definition, setDefinition] = useState<DefinedWord>();
  const isVertical = useVerticalMediaQuery();
  const listRef = useRef<HTMLDivElement>(null);
  const userId = user.id;

  const modalTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (modalTimer.current) {
        clearTimeout(modalTimer.current);
      }
    };
  }, []);

  const handleWordClick: React.MouseEventHandler = async (event) => {
    if (modalTimer.current) {
      clearTimeout(modalTimer.current);
    }
    const word = event.currentTarget.textContent as string;
    setDefinition({ word, definition: undefined });
    const start = Date.now();
    const definition = await getDefinition(word);
    if (definition) {
      modalTimer.current = setTimeout(
        () => {
          setDefinition({ word, definition });
        },
        Math.max(1000 - (Date.now() - start)),
        0,
      );
    }
  };

  const handleHideModal = useCallback(() => {
    setDefinition(undefined);
  }, [setDefinition]);

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
                "Words-word-own": words[word].userId === userId,
              });
              return (
                <li key={i} className={className} onClick={handleWordClick}>
                  {word}
                </li>
              );
            })}
          </ul>
        </div>
        <Button
          className="Words-show-list"
          size="small"
          onClick={() => setWordListExpanded(!wordListExpanded)}
        >
          ▼
        </Button>
        <div className="Words-controls">
          <span className="Words-metrics">
            {Object.keys(words).length} / {totalWords} words
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
          <Modal onHide={handleHideModal}>
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
