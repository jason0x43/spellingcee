import React, { useEffect, useState } from "react";
import { Message } from "../store/ui.ts";
import { classNames } from "../util.ts";

export type ToastMessageProps = {
  message: Message | undefined;
};

const ToastMessage: React.FC<ToastMessageProps> = (props) => {
  const { message } = props;
  const [text, setText] = useState<string>(message?.message ?? "");

  useEffect(() => {
    if (message) {
      setText(message.message);
    }
  }, [message]);

  const messageClass = classNames("ToastMessage", {
    "ToastMessage-visible": Boolean(message),
    "ToastMessage-bad": message?.type === "bad",
    "ToastMessage-good": message?.type === "good",
  });

  return <div className={messageClass}>{text}</div>;
};

export default ToastMessage;
