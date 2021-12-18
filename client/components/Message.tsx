import { React, useEffect, useRef, useState } from "../deps.ts";
import { classNames } from "../util.ts";

export interface MessageProps {
  message: string | undefined;
  type?: "normal" | "good" | "bad";
  visibleTime?: "short" | "normal" | "long";
  onHide?(): void;
}

const Message: React.FC<MessageProps> = (props) => {
  const { message, onHide, type, visibleTime } = props;
  const [visible, setVisible] = useState(false);
  let showTime: number;

  switch (visibleTime) {
    case "short":
      showTime = 500;
      break;
    case "long":
      showTime = 2000;
      break;
    default:
      showTime = 1000;
  }

  const showTimer = useRef<number>();

  useEffect(() => {
    if (message) {
      setVisible(true);

      showTimer.current = globalThis.setTimeout(() => {
        setVisible(false);
        onHide?.();
      }, showTime);

      return () => {
        globalThis.clearTimeout(showTimer.current);
        setVisible(false);
        onHide?.();
      };
    } else {
      globalThis.clearTimeout(showTimer.current);
      setVisible(false);
    }
  }, [message, onHide, setVisible, showTime]);

  const messageClass = classNames({
    Message: true,
    "Message-visible": visible,
    "Message-bad": type === "bad",
    "Message-good": type === "good",
  });

  return <div className={messageClass}>{message}</div>;
};

export default Message;
