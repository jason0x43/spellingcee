import React from 'react';
import classNames from 'classnames';
import './Input.css';

interface InputProps {
  input: string[];
  pangram: string;
  isInvalid?: boolean;
}

export default function Input(props: InputProps) {
  const { input, pangram, isInvalid } = props;
  const className = classNames({
    Input: true,
    'Input-invalid': isInvalid,
  });
  return (
    <div className={className}>
      {input.map((letter, i) => {
        const className = classNames({
          'Input-letter': true,
          'Input-letter-invalid': !pangram.includes(letter),
        });
        return (
          <div key={i} className={className}>
            {letter}
          </div>
        );
      })}

      <div className="Input-cursor" />
    </div>
  );
}
