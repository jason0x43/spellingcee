import React from "react";
import { classNames } from "../util.ts";

export interface InputProps {
  onChange: (value: string) => void;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  type?: "text" | "password";
}

const Input: React.FC<InputProps> = (props) => {
  const {
    className: extraClass,
    placeholder,
    onChange,
    disabled,
    value,
    type,
  } = props;

  return (
    <input
      className={classNames("Input", extraClass)}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
      placeholder={placeholder}
      type={type ?? "text"}
    />
  );
};

export default Input;
