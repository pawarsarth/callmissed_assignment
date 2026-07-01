# Callback — a CallMissed chatbot

A small Next.js (App Router) chat app for the CallMissed API. Chat + vision run on
`kimi-k2.7-code`, image generation runs on `flux-2-klein-9b`. Streaming, image upload/paste,
and a "Generate image" mode are all built in.

## Features

- **Streaming chat** over SSE against `POST /v1/chat/completions`.
- **Vision**: attach or paste an image and ask about it — sent as an `image_url` content part
  alongside your text, same model as chat.
- **Image generation**: a dedicated "Generate image" mode sends your prompt to
  `POST /v1/images/generations` and renders the returned `b64_json` inline, with a download button.
- **Server-only API key**: both CallMissed calls happen in Route Handlers
  (`app/api/chat`, `app/api/images`). The `cm_` key never ships to the browser.
- **Error, loading, and empty states**: friendly messages for 401/402/403/429 and
  `unsupported_image_input`, a typing indicator while streaming, a placeholder while an image
  generates, and a suggestion-driven empty state.
- **In-app guide**: the "Guide" button in the header opens a panel with the two models in use
  and steps to get your own key, linking to docs.callmissed.com.

## Run it locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste your key: CALLMISSED_API_KEY=cm_...
npm run dev
```

Open http://localhost:3000.

Your key needs the `llm` and `image` permissions (Profile → API Keys → Create API Key on
app.callmissed.com).

## Why I built it this way

- **Explicit "Generate image" mode instead of intent-sniffing text.** Parsing "draw a neon
  city" out of freeform chat text is fragile and easy to get wrong (what about "draw me a
  comparison table"?). A mode toggle is one click, is unambiguous, and makes it obvious to the
  user which model + endpoint their message is about to hit. Trade-off: it's one extra click
  compared to a magic auto-detect.
- **Chat route is a thin, honest proxy.** `app/api/chat/route.ts` forwards CallMissed's SSE
  stream to the browser byte-for-byte instead of re-encoding it into a custom protocol. Less
  code, and the client parser matches the documented format exactly (`data: {...}` chunks,
  `data: [DONE]` sentinel) — verified against a simulated version of that exact chunk sequence
  before wiring it into the UI.
- **No AI SDK dependency for chat.** The docs' SSE shape is simple enough that a ~30-line
  `ReadableStream` reader in `ChatShell.tsx` is easier to reason about and debug than pulling in
  a streaming library for one code path.
- **Images always requested as `b64_json`.** Keeps the "download image" button working offline
  from the request (no re-fetching a signed URL that might expire) and avoids a second round
  trip.
- **Server-side error normalization** (`lib/callmissed.ts`) turns CallMissed's OpenAI-style
  error JSON into one short sentence per status code, so the chat bubble stays readable instead
  of dumping a raw JSON blob at the user.

## What I'd do next with more time

- Multiple conversations / history persisted to `localStorage` or a small DB.
- A stop-streaming button (the fetch reader is already cancelable via `AbortController`, just
  not wired to a UI control yet).
- Basic per-IP rate limiting on the two API routes.
- Size/aspect-ratio controls for image generation, and letting the user pick from the free
  image models instead of only `flux-2-klein-9b`.
- Light theme toggle.

## Where I used AI

I used Claude to scaffold the project: the route handlers, the SSE client parser, the component
structure, and the design pass on the UI (`frontend-design`-style token system — the "signal
bars" mark, the CallMissed-adjacent name "Callback", the accent color). Before writing the
streaming code I had it fetch the live CallMissed docs (`chat-completion`, `chat-streaming`
pages) to confirm the exact request/response shapes rather than guessing from generic
OpenAI-compatible conventions, then hand-simulated the documented chunk sequence through the
parser to check it reconstructs the full message correctly. I reviewed and adjusted the
generated code (error messages, the explicit chat/image mode split, trimming unnecessary
dependencies) rather than using it as-is.

## Tech

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- `react-markdown` for assistant replies
- No external AI/HTTP SDK — plain `fetch` against `https://api.callmissed.com/v1`

## Folder structure

```
app/
  api/
    chat/route.ts       # POST — streams kimi-k2.7-code chat/vision replies
    images/route.ts     # POST — flux-2-klein-9b image generation
  layout.tsx             # fonts, metadata, <html>/<body> shell
  page.tsx                # renders <ChatShell />
  globals.css              # Tailwind + prose styles for markdown replies
components/
  ChatShell.tsx           # top-level state: messages, SSE parsing, mode switch
  Composer.tsx            # input box, image attach/paste, chat/image mode toggle
  MessageBubble.tsx        # renders text, vision input thumbnail, generated image
  GuidePanel.tsx           # slide-over: models used + how to get an API key
  Icons.tsx                 # small inline icon set
lib/
  types.ts                  # shared types + model id constants
  callmissed.ts               # server-only base URL, auth header, error mapping
```
