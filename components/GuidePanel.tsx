"use client";

import { CloseIcon, SignalMark } from "./Icons";
import { CHAT_MODEL, IMAGE_MODEL } from "@/lib/types";

export default function GuidePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="About this app"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm border-l border-border bg-surface p-6 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-signal">
            <SignalMark width={18} height={18} />
            <h2 className="font-display text-lg font-medium text-text">About this chat</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="rounded-md p-1.5 text-muted transition hover:bg-raised hover:text-text"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted">
          <section>
            <h3 className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-faint">
              Models in use
            </h3>
            <ul className="space-y-2">
              <li className="rounded-lg border border-border bg-raised px-3 py-2">
                <div className="font-mono text-xs text-ring">{CHAT_MODEL}</div>
                <div className="mt-0.5 text-muted">Chat replies and image understanding (vision).</div>
              </li>
              <li className="rounded-lg border border-border bg-raised px-3 py-2">
                <div className="font-mono text-xs text-signal">{IMAGE_MODEL}</div>
                <div className="mt-0.5 text-muted">Generates images from a text prompt.</div>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-faint">
              Get your own API key
            </h3>
            <ol className="list-decimal space-y-1.5 pl-4">
              <li>
                Sign up at{" "}
                <a href="https://app.callmissed.com" target="_blank" rel="noreferrer">
                  app.callmissed.com
                </a>
                .
              </li>
              <li>Go to Profile → API Keys → Create API Key.</li>
              <li>Give it the <span className="font-mono text-text">llm</span> and <span className="font-mono text-text">image</span> permissions.</li>
              <li>
                Copy it into <span className="font-mono text-text">.env.local</span> as{" "}
                <span className="font-mono text-text">CALLMISSED_API_KEY</span>. It's used only on
                the server — this app never sends it to your browser.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="mb-1.5 font-display text-xs font-medium uppercase tracking-wide text-faint">
              Docs
            </h3>
            <p>
              Full API reference, request shapes, and free-tier limits live at{" "}
              <a href="https://docs.callmissed.com" target="_blank" rel="noreferrer">
                docs.callmissed.com
              </a>
              .
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
