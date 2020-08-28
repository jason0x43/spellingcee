import React, { MouseEventHandler, useCallback, useState } from 'react';
import useAppState from './hooks/useAppState';
import Button from './Button';
import Modal from './Modal';
import './GameSelect.css';

export default function GameSelect() {
  const [appState, setAppState, , addGame, removeGame] = useAppState();
  const [selecting, setSelecting] = useState(false);

  const handleClick = useCallback(() => {
    setSelecting(true);
  }, [setSelecting]);

  const handleHideModal = useCallback(() => {
    setSelecting(false);
  }, [setSelecting]);

  const handleGameSelect: MouseEventHandler = useCallback(
    (event) => {
      const gameId = event.currentTarget.getAttribute('data-game-id')!;
      if (gameId) {
        setAppState({
          ...appState,
          currentGame: gameId,
        });
      } else {
        addGame();
      }
      setSelecting(false);
    },
    [addGame, appState, setAppState]
  );

  const handleRemoveGame: MouseEventHandler = useCallback(
    (event) => {
      // Walk up the DOM from the button that fired the event, looking for a
      // node with a game ID attribute
      let node: HTMLElement | null = event.currentTarget as HTMLElement;
      while (node && !node.getAttribute('data-game-id')) {
        node = node.parentElement;
      }
      const gameId = node?.getAttribute('data-game-id');
      if (gameId) {
        removeGame(gameId);
      }

      // Don't let events propogate -- they'd end up being handled by the
      // containing game element, which we don't want since we just deleted the
      // game.
      event.stopPropagation();
    },
    [removeGame]
  );

  return (
    <div className="GameSelect">
      <Button className="GameSelect-id" type="link" onClick={handleClick}>
        {appState.currentGame}
      </Button>
      {selecting && (
        <Modal onHide={handleHideModal}>
          <ul className="GameSelect-games">
            <li
              className="GameSelect-game GameSelect-new-game"
              role="button"
              onClick={handleGameSelect}
            >
              +
            </li>
            {Object.keys(appState.games).map((game) => {
              const gameState = appState.games[game];
              return (
                <li
                  className="GameSelect-game"
                  key={game}
                  data-game-id={game}
                  onClick={handleGameSelect}
                >
                  <Button
                    className="GameSelect-remove"
                    type="text"
                    onClickCapture={handleRemoveGame}
                  >
                    ✕
                  </Button>
                  <div className="GameSelect-id">{game}</div>
                  <dl className="GameSelect-info">
                    <div>
                      <dt>Last played</dt>
                      <dd>
                        {new Date(gameState.lastPlayed).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt>Difficulty</dt>
                      <dd>{gameState.difficulty}</dd>
                    </div>
                    <div>
                      <dt>Words</dt>
                      <dd>
                        {gameState.words.length} / {gameState.totalWords}
                      </dd>
                    </div>
                    <div>
                      <dt>Score</dt>
                      <dd>
                        {gameState.score} / {gameState.maxScore}
                      </dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </div>
  );
}
