import { React } from "../deps.ts";
import { selectGameLetters } from "../store/game.ts";
import { useAppSelector } from "../store/mod.ts";
import { selectInput } from "../store/ui.ts";
import { classNames } from "../util.ts";

const LetterInput: React.FC = () => {
  const input = useAppSelector(selectInput);
  const validLetters = useAppSelector(selectGameLetters);

  const className = classNames({
    LetterInput: true,
    [`LetterInput-${input.length}`]: true,
  });
  return (
    <div className={className}>
      {input.map((letter, i) => {
        const className = classNames({
          "LetterInput-letter": true,
          "LetterInput-letter-invalid": !validLetters?.includes(letter),
        });
        return (
          <div key={i} className={className}>
            {letter}
          </div>
        );
      })}

      <div className="LetterInput-cursor" />
    </div>
  );
};

export default LetterInput;
