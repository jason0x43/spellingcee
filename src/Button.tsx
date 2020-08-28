import React, { ReactNode, MouseEvent } from 'react';
import classNames from 'classnames';
import './Button.css';

export interface ButtonProps {
  className?: string;
  size?: 'large' | 'normal' | 'small';
  type?: 'link' | 'text' | 'normal';
  children: ReactNode;
  onClick?(event: MouseEvent): void;
  onClickCapture?(event: MouseEvent): void;
}

export default function Button(props: ButtonProps) {
  const {
    className: propClass,
    children,
    onClick,
    onClickCapture,
    size,
    type,
  } = props;
  let className = classNames({
    Button: true,
    'Button-small': size === 'small',
    'Button-large': size === 'large',
    'Button-link': type === 'link',
    'Button-text': type === 'text',
  });
  if (propClass) {
    className += ` ${propClass}`;
  }

  return (
    <button
      className={className}
      onClick={onClick}
      onClickCapture={onClickCapture}
    >
      {children}
    </button>
  );
}
