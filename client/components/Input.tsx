import { React } from "../deps.ts";
import { selectGameLetters } from "../store/game.ts";
import { useAppSelector } from "../store/mod.ts";
import { selectInput } from "../store/ui.ts";
import { classNames } from "../util.ts";

const Input: React.FC = () => {
  const input = useAppSelector(selectInput);
  const validLetters = useAppSelector(selectGameLetters);

  const className = classNames({
    Input: true,
    [`Input-${input.length}`]: true,
  });
  return (
    <div className={className}>
      {input.map((letter, i) => {
        const className = classNames({
          "Input-letter": true,
          "Input-letter-invalid": !validLetters?.includes(letter),
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
