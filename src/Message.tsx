import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './Message.css';

interface MessageProps {
  children: ReactNode;
  isVisible: boolean;
}

export default function Message(props: MessageProps) {
  const { children, isVisible } = props;
  const messageClass = classNames({
    'Message': true,
    'Message-visible': isVisible,
  });

  return (
    <div className={messageClass}>
      {children}
    </div>
  );
}
