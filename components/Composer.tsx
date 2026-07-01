"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { CloseIcon, ImageIcon, PaperclipIcon, SendIcon, SparkleIcon } from "./Icons";
import type { ImageAttachment } from "@/lib/types";

export type ComposerMode = "chat" | "image";

interface ComposerProps {
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  onSend: (text: string, attachment?: ImageAttachment) => void;
  disabled: boolean;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB, generous for a chat attachment

function fileToAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ dataUrl: reader.result as string, name: file.name });
    reader.onerror = () => reject(new Error("Couldn't read that image."));
    reader.readAsDataURL(file);
  });
}

export default function Composer({ mode, onModeChange, onSend, disabled }: ComposerProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<ImageAttachment | undefined>();
  const [attachError, setAttachError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageMode = mode === "image";

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setAttachError(null);
    if (!file.type.startsWith("image/")) {
      setAttachError("Only image files are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setAttachError("That image is larger than 8MB — try a smaller one.");
      return;
    }
    try {
      setAttachment(await fileToAttachment(file));
    } catch {
      setAttachError("Couldn't read that image.");
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) handleFile(file);
    }
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (isImageMode && attachment) return; // vision input doesn't apply in image-gen mode
    onSend(trimmed, attachment);
    setText("");
    setAttachment(undefined);
    setAttachError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border bg-surface/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <ModeButton
            active={mode === "chat"}
            onClick={() => onModeChange("chat")}
            icon={<PaperclipIcon width={13} height={13} />}
            label="Chat"
          />
          <ModeButton
            active={mode === "image"}
            onClick={() => onModeChange("image")}
            icon={<SparkleIcon width={13} height={13} />}
            label="Generate image"
          />
        </div>

        {attachment && (
          <div className="flex w-fit items-center gap-2 rounded-lg border border-border bg-raised px-2 py-1.5">
            <img src={attachment.dataUrl} alt={attachment.name} className="h-9 w-9 rounded object-cover" />
            <span className="max-w-[10rem] truncate text-xs text-muted">{attachment.name}</span>
            <button
              onClick={() => setAttachment(undefined)}
              aria-label="Remove attached image"
              className="rounded p-0.5 text-faint hover:text-text"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        )}

        {attachError && <p className="text-xs text-danger">{attachError}</p>}

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-raised px-3 py-2 focus-within:border-ring/60">
          {!isImageMode && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach an image"
                title="Attach an image to ask about"
                className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-surface hover:text-text"
              >
                <ImageIcon width={18} height={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </>
          )}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              isImageMode
                ? "Describe an image, e.g. \"a neon city at night, cinematic\""
                : attachment
                  ? "Ask something about this image…"
                  : "Message Callback… (paste an image to ask about it)"
            }
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm text-text placeholder:text-faint focus:outline-none"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            aria-label="Send message"
            className="shrink-0 rounded-lg bg-signal p-2 text-ink transition enabled:hover:bg-signal-dim disabled:cursor-not-allowed disabled:opacity-30"
          >
            <SendIcon width={16} height={16} />
          </button>
        </div>
        <p className="px-1 text-[11px] text-faint">
          {isImageMode
            ? "Sent to flux-2-klein-9b as a text-to-image request."
            : "Enter to send, Shift+Enter for a new line."}
        </p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
        active
          ? "border-signal/50 bg-signal/10 text-signal"
          : "border-border text-muted hover:text-text"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
