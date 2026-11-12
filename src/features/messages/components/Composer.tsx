"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { Camera, Image as ImageIcon, Loader2, SendHorizontal, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_LIST = ["😍", "🔥", "✨", "👗", "👠", "💎", "👍", "🙌", "❤️", "🤩", "🖤", "🕶️", "😂", "👀"];
/** The text box grows with the message up to about five lines, then scrolls. */
const MAX_HEIGHT = 128;

/** Keeps the keyboard up when a composer button is tapped (and the layout from jumping under the finger). */
const keepFocus = (e: PointerEvent) => e.preventDefault();

/**
 * Instagram-style composer: a camera button, a text box that grows as you type, and
 * emoji / gallery buttons that give way to Send once there's something to send.
 * Docked to the bottom of the thread; `data-composer` lets the phone layout hide the
 * tab bar while you type (see globals.css).
 */
export function Composer({
  value,
  onChange,
  onSend,
  onPick,
  attachment,
  onRemoveAttachment,
  uploading,
  placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onPick: (file: File) => void;
  attachment: { preview: string; name: string } | null;
  onRemoveAttachment: () => void;
  uploading: boolean;
  placeholder: string;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const canSend = (value.trim().length > 0 || Boolean(attachment)) && !uploading;

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend();
    setEmojiOpen(false);
  };

  // Enter sends on a desktop keyboard; on phones the return key adds a line, and Send sends.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) submit(e);
  };

  const filePicker = (ref: RefObject<HTMLInputElement | null>, capture?: boolean) => (
    <input
      ref={ref}
      type="file"
      accept="image/*"
      capture={capture ? "environment" : undefined}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onPick(file);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="shrink-0 border-t border-white/8 bg-canvas/70 px-3 pb-2.5 pt-2 backdrop-blur-xl sm:px-5 md:bg-transparent md:pb-4 md:pt-3 md:backdrop-blur-none">
      {emojiOpen && (
        <div className="no-scrollbar -mx-1 mb-2 flex gap-0.5 overflow-x-auto px-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onPointerDown={keepFocus}
              onClick={() => onChange(value + emoji)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-2xl transition-colors hover:bg-white/8"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {attachment && (
        <div className="mb-2 flex items-center gap-3">
          <span className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={attachment.preview} alt="" className="size-16 rounded-2xl object-cover ring-1 ring-white/15" />
            <button
              type="button"
              onClick={onRemoveAttachment}
              aria-label="Remove photo"
              className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-canvas text-white ring-1 ring-white/25 transition-colors hover:bg-[#1a1840]"
            >
              <X className="size-3.5" />
            </button>
          </span>
          <span className="min-w-0 truncate text-xs text-muted">{attachment.name}</span>
        </div>
      )}

      <form onSubmit={submit} className="flex items-end gap-1.5 rounded-[24px] border border-white/12 bg-white/[0.06] p-1.5 transition-colors focus-within:border-white/25">
        {filePicker(cameraRef, true)}
        {filePicker(galleryRef)}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          aria-label="Take a photo"
          className="btn-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-[filter] hover:brightness-110"
        >
          <Camera className="size-[18px]" strokeWidth={2} />
        </button>

        <textarea
          ref={textRef}
          data-composer
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="send"
          className="no-scrollbar min-h-9 min-w-0 flex-1 resize-none bg-transparent px-1.5 py-[7px] text-base leading-[22px] text-white outline-none placeholder:text-muted md:text-[15px]"
        />

        {canSend || uploading ? (
          <button
            type="submit"
            onPointerDown={keepFocus}
            disabled={!canSend}
            aria-label="Send"
            className="btn-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-[filter] hover:brightness-110 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
          </button>
        ) : (
          <span className="flex shrink-0 items-center">
            <button
              type="button"
              onPointerDown={keepFocus}
              onClick={() => setEmojiOpen((v) => !v)}
              aria-label="Emoji"
              aria-pressed={emojiOpen}
              className={cn("flex size-9 items-center justify-center rounded-full transition-colors hover:text-white", emojiOpen ? "text-white" : "text-subtle")}
            >
              <Smile className="size-[22px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              aria-label="Choose a photo"
              className="flex size-9 items-center justify-center rounded-full text-subtle transition-colors hover:text-white"
            >
              <ImageIcon className="size-[22px]" strokeWidth={1.75} />
            </button>
          </span>
        )}
      </form>
    </div>
  );
}
