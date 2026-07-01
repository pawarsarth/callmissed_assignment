"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import Composer, { type ComposerMode } from "./Composer";
import GuidePanel from "./GuidePanel";
import { InfoIcon, SignalMark } from "./Icons";
import type { ChatMessage, ImageAttachment } from "@/lib/types";
import { CHAT_MODEL, IMAGE_MODEL } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SUGGESTIONS: { text: string; mode: ComposerMode }[] = [
  { text: "Explain how a debounce works, with a short example", mode: "chat" },
  { text: "A neon city skyline at night, cinematic", mode: "image" },
  { text: "What's a clean way to structure a Next.js API route?", mode: "chat" },
];

export default function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<ComposerMode>("chat");
  const [guideOpen, setGuideOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendChat(text: string, attachment?: ImageAttachment) {
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      kind: "text",
      content: text,
      inputImage: attachment,
      createdAt: Date.now(),
    };
    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      kind: "text",
      content: "",
      streaming: true,
      createdAt: Date.now(),
    };

    const history = [...messages, userMsg];
    setMessages([...history, assistantMsg]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
            imageDataUrl: m.inputImage?.dataUrl,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Request failed (${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const chunk = JSON.parse(payload);
            const delta = chunk?.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
              );
            }
          } catch {
            // partial/non-JSON chunk boundary — safe to ignore, next chunk completes it
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, streaming: false, content: "", error: message } : m
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendImagePrompt(prompt: string) {
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      kind: "text",
      content: prompt,
      createdAt: Date.now(),
    };
    const resultId = uid();
    const resultMsg: ChatMessage = {
      id: resultId,
      role: "assistant",
      kind: "image",
      content: prompt,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, resultMsg]);
    setBusy(true);

    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? `Request failed (${res.status}).`);

      setMessages((prev) =>
        prev.map((m) => (m.id === resultId ? { ...m, imageUrl: body.imageUrl } : m))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) =>
        prev.map((m) => (m.id === resultId ? { ...m, error: message } : m))
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSend(text: string, attachment?: ImageAttachment) {
    if (mode === "image") {
      sendImagePrompt(text);
    } else {
      sendChat(text, attachment);
    }
  }

  function handleSuggestion(s: { text: string; mode: ComposerMode }) {
    setMode(s.mode);
    if (s.mode === "image") sendImagePrompt(s.text);
    else sendChat(s.text);
  }

  return (
    <div className="flex h-dvh flex-col bg-ink">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-signal/40 bg-signal/10 text-signal">
            <SignalMark width={16} height={16} />
          </div>
          <div>
            <h1 className="font-display text-sm font-medium leading-tight text-text">Callback</h1>
            <p className="font-mono text-[11px] leading-tight text-faint">
              {CHAT_MODEL} · {IMAGE_MODEL}
            </p>
          </div>
        </div>
        <button
          onClick={() => setGuideOpen(true)}
          aria-label="About this app and how to get an API key"
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-ring/50 hover:text-text"
        >
          <InfoIcon width={14} height={14} />
          Guide
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <EmptyState onPick={handleSuggestion} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>
      </div>

      <Composer mode={mode} onModeChange={setMode} onSend={handleSend} disabled={busy} />
      <GuidePanel open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
}

function EmptyState({
  onPick,
}: {
  onPick: (s: { text: string; mode: ComposerMode }) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-signal/30 bg-signal/10 text-signal">
        <SignalMark width={26} height={26} />
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-medium text-text">Ask, or ask it to draw</h2>
        <p className="max-w-sm text-sm text-muted">
          Chat normally, paste an image to ask about it, or switch to “Generate image” to make one.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onPick(s)}
            className="rounded-full border border-border px-3.5 py-1.5 text-xs text-muted transition hover:border-ring/50 hover:text-text"
          >
            {s.text}
          </button>
        ))}
      </div>
    </div>
  );
}
