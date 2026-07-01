"use client";

import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/lib/types";
import { AlertIcon, DownloadIcon, SignalMark } from "./Icons";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-signal [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-signal [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-signal" />
    </span>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex w-full animate-rise gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        aria-hidden="true"
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
          isUser
            ? "border-ring/40 bg-ring/10 text-ring"
            : "border-signal/40 bg-signal/10 text-signal"
        }`}
      >
        {isUser ? (
          <span className="font-display text-xs font-medium">You</span>
        ) : (
          <SignalMark width={13} height={13} />
        )}
      </div>

      <div className={`flex max-w-[78%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {message.inputImage && (
          <img
            src={message.inputImage.dataUrl}
            alt={message.inputImage.name}
            className="max-h-52 rounded-xl border border-border object-cover"
          />
        )}

        {message.error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertIcon width={16} height={16} className="mt-0.5 shrink-0" />
            <span>{message.error}</span>
          </div>
        ) : message.kind === "image" ? (
          message.imageUrl ? (
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-raised">
              <img src={message.imageUrl} alt={message.content} className="block max-w-full" />
              <a
                href={message.imageUrl}
                download="callmissed-image.png"
                className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-ink/80 px-2.5 py-1.5 text-xs text-text opacity-0 backdrop-blur transition group-hover:opacity-100"
              >
                <DownloadIcon width={14} height={14} />
                Download
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-raised px-4 py-3 text-sm text-muted">
              <TypingDots />
              Generating image…
            </div>
          )
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed ${
              isUser
                ? "bg-ring/15 text-text"
                : "border border-border bg-surface text-text"
            }`}
          >
            {message.content ? (
              <div className="prose-chat">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : message.streaming ? (
              <TypingDots />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
