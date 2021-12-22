import { React } from "../deps.ts";
import { classNames } from "../util.ts";

export interface ButtonProps {
  className?: string;
  size?: "large" | "normal" | "small";
  type?: "link" | "text" | "normal";
  tooltip?: string;
  children: React.ReactNode;
  onClick?(event: React.MouseEvent): void;
  onClickCapture?(event: React.MouseEvent): void;
}

const Button: React.FC<ButtonProps> = (props) => {
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
    "Button-small": size === "small",
    "Button-large": size === "large",
    "Button-link": type === "link",
    "Button-text": type === "text",
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