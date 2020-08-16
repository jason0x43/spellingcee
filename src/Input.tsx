import React from 'react';
import classNames from 'classnames';
import './Input.css';

interface InputProps {
  input: string[];
  pangram: string;
}

export default function Input(props: InputProps) {
  const { input, pangram } = props;
  return (
    <div className="Input">
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
    </div>
  );
}
