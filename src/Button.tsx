import React, { ReactNode } from 'react';
import classNames from 'classnames';
import './Button.css';

export interface ButtonProps {
  size?: 'large' | 'normal' | 'small';
  children: ReactNode;
  onClick?(): void;
}

export default function Button(props: ButtonProps) {
  const { children, onClick, size } = props;
  const className = classNames({
    Button: true,
    'Button-small': size === 'small',
    'Button-large': size === 'large'
  });

  return <button className={className} onClick={onClick}>{children}</button>;
}
