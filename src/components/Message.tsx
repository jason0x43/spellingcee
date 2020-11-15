import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { isMessageGood, isMessageVisible, selectMessage } from '../store';
import './Message.css';

const Message: FunctionComponent = () => {
  const message = useSelector(selectMessage);
  const isVisible = useSelector(isMessageVisible);
  const isGood = useSelector(isMessageGood);
  const messageClass = classNames({
    Message: true,
    'Message-visible': isVisible,
    'Message-good': isGood,
  });

  return <div className={messageClass}>{message}</div>;
};

export default Message;
