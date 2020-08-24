import React, { ReactNode, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface ModalProps {
  children: ReactNode;
  onHide(): void;
  showCloseButton?: boolean;
}

export default function Modal(props: ModalProps) {
  const { children, onHide, showCloseButton } = props;
  const nodeRef = useRef(document.createElement('div'));
  const node = nodeRef.current;

  const handleKeyPress = useCallback((event) => {
    event.stopPropagation();
    const { key } = event;
    if (key === 'Escape') {
      onHide();
    }
  }, [onHide]);


  const handleClick = useCallback((event) => {
    if (event.target === node) {
      onHide();
    }
  }, [node, onHide]);

  useEffect(() => {
    node.addEventListener('keypress', handleKeyPress, { capture: true });
    node.addEventListener('click', handleClick);
    node.className = 'Modal-background';
    node.tabIndex = -1;
    document.body.appendChild(node);
    node.focus();

    const showTimer = setTimeout(() => {
      node.classList.add('Modal-background-active');
    });

    return () => {
      clearTimeout(showTimer);
      node.classList.remove('Modal-background-active');
      node.removeEventListener('keypress', handleKeyPress);
      setTimeout(() => {
        node.remove();
      }, 1000);
    };
  }, [node, handleClick, handleKeyPress]);

  return createPortal(
    <div className="Modal">
      {showCloseButton && <div className="Modal-close">X</div>}
      <div className="Modal-content">{children}</div>
    </div>,
    node
  );
}
