import { React } from "../deps.ts";
import { classNames } from "../util.ts";

export interface InputProps {
  value: string[];
  validLetters: string[];
  isInvalid?: boolean;
}

const Input: React.FC<InputProps> = (props) => {
  const { value: input, isInvalid, validLetters } = props;

  const className = classNames({
    Input: true,
    [`Input-${input.length}`]: true,
    "Input-invalid": isInvalid,
  });
  return (
    <div className={className}>
      {input.map((letter, i) => {
        const className = classNames({
          "Input-letter": true,
          "Input-letter-invalid": !validLetters.includes(letter),
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
};

export default Input;
