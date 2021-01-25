import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import './Message.css';

export interface MessageProps {
  message: string | undefined;
  type?: 'normal' | 'good' | 'bad';
  visibleTime?: 'short' | 'normal' | 'long';
  onHide?(): void;
}

const Message: FunctionComponent<MessageProps> = (props) => {
  const { message, onHide, type, visibleTime } = props;
  const [visible, setVisible] = useState(false);
  let showTime: number;

  switch (visibleTime) {
    case 'short':
      showTime = 500;
      break;
    case 'long':
      showTime = 2000;
      break;
    default:
      showTime = 1000;
  }

  const showTimer = useRef<number>();

  useEffect(() => {
    if (message) {
      setVisible(true);

      showTimer.current = window.setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, showTime);

      return () => {
        window.clearTimeout(showTimer.current);
        setVisible(false);
        onHide?.();
      };
    } else {
      window.clearTimeout(showTimer.current);
      setVisible(false);
    }
  }, [message, onHide, setVisible, showTime]);

  const messageClass = classNames({
    Message: true,
    'Message-visible': visible,
    'Message-bad': type === 'bad',
    'Message-good': type === 'good',
  });

  return <div className={messageClass}>{message}</div>;
};

export default Message;
