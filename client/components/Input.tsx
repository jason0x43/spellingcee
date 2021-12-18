import { React, useSelector } from "../deps.ts";
import { classNames } from "../util.ts";
import { selectInput, selectLetterMessage, selectPangram } from "../store.ts";

const Input: React.FC = () => {
  const input = useSelector(selectInput);
  const letterMessage = useSelector(selectLetterMessage);
  const isInvalid = letterMessage && letterMessage.type === "bad";
  const pangram = useSelector(selectPangram);

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
          "Input-letter-invalid": !pangram.includes(letter),
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
