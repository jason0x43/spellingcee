import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Spinner from './Spinner';
import './Modal.css';

interface ModalProps {
  children?: ReactNode;
  onHide?(): void;
  showCloseButton?: boolean;
}

export default function Modal(props: ModalProps) {
  const { children, onHide, showCloseButton } = props;
  const nodeRef = useRef(document.createElement('div'));
  const loadingMode = children == null;
  const node = nodeRef.current;

  const handleKeyPress = useCallback(
    (event) => {
      event.stopPropagation();
      const { key } = event;
      if (key === 'Escape' && onHide) {
        onHide();
      }
    },
    [onHide]
  );

  const handleClick = useCallback(
    (event) => {
      if (event.target === node && onHide) {
        onHide();
      }
    },
    [node, onHide]
  );

  const showTimer = useRef<number>();
  const removeTimer = useRef<number>();

  useEffect(() => {
    node.className = 'Modal-background';
    node.tabIndex = -1;

    if (loadingMode) {
      node.classList.add('Modal-background-loading');
      node.classList.add('Modal-background-active');
    } else {
      node.addEventListener('keypress', handleKeyPress, { capture: true });
      node.addEventListener('click', handleClick);
    }

    document.body.appendChild(node);
    node.focus();

    if (showTimer.current) {
      clearTimeout(showTimer.current);
    }
    if (removeTimer.current) {
      clearTimeout(removeTimer.current);
    }

    showTimer.current = window.setTimeout(() => {
      node.classList.add('Modal-background-active');
    });

    return () => {
      clearTimeout(showTimer.current);
      node.classList.remove('Modal-background-active');
      if (!loadingMode) {
        node.removeEventListener('keypress', handleKeyPress);
        node.removeEventListener('click', handleClick);
      }
      removeTimer.current = window.setTimeout(() => {
        node.remove();
      }, 1000);
    };
  }, [node, handleClick, handleKeyPress, loadingMode]);

  return createPortal(
    children ? (
      <div className="Modal">
        {showCloseButton && <div className="Modal-close">X</div>}
        <div className="Modal-content">{children}</div>
      </div>
    ) : (
      <Spinner />
    ),
    node
  );
}
