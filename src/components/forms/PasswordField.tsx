"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { TextField, type TextFieldProps } from "./TextField";

export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing" | "icon">) {
  const [visible, setVisible] = useState(false);
  const Toggle = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      icon={Lock}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-accent-bright"
        >
          <Toggle className="size-[18px]" strokeWidth={1.75} />
        </button>
      }
    />
  );
}
