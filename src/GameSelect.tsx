import React, { MouseEventHandler, useCallback, useState } from 'react';
import useAppState from './hooks/useAppState';
import Button from './Button';
import Modal from './Modal';
import './GameSelect.css';

export default function GameSelect() {
  const [appState, setAppState] = useAppState();
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
      setAppState({
        ...appState,
        currentGame: gameId,
      });
      setSelecting(false);
    },
    [appState, setAppState]
  );

  return (
    <div className="GameSelect">
      <Button className="GameSelect-id" type="link" onClick={handleClick}>
        {appState.currentGame}
      </Button>
      {selecting && (
        <Modal onHide={handleHideModal}>
          <ul className="GameSelect-games">
            {Object.keys(appState.games).map((game) => (
              <li key={game}>
                <span onClick={handleGameSelect}>{game}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
