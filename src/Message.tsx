import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './Message.css';

interface MessageProps {
  children: ReactNode;
  isVisible: boolean;
  isGood?: boolean;
}

export default function Message(props: MessageProps) {
  const { children, isVisible, isGood = false } = props;
  const messageClass = classNames({
    'Message': true,
    'Message-visible': isVisible,
    'Message-good': isGood,
  });

  return (
    <div className={messageClass}>
      {children}
    </div>
  );
}
