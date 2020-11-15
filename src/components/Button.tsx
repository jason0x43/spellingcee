import React, { ReactNode, MouseEvent, FunctionComponent } from 'react';
import classNames from 'classnames';
import './Button.css';

export interface ButtonProps {
  className?: string;
  size?: 'large' | 'normal' | 'small';
  type?: 'link' | 'text' | 'normal';
  tooltip?: string;
  children: ReactNode;
  onClick?(event: MouseEvent): void;
  onClickCapture?(event: MouseEvent): void;
}

const Button: FunctionComponent<ButtonProps> = (props) => {
  const {
    className: propClass,
    children,
    onClick,
    onClickCapture,
    size,
    tooltip,
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
      title={tooltip}
      onClick={onClick}
      onClickCapture={onClickCapture}
    >
      {children}
    </button>
  );
};

export default Button;
