import { NextRequest } from "next/server";
import {
  CALLMISSED_BASE_URL,
  callmissedHeaders,
  describeUpstreamError,
} from "@/lib/callmissed";
import { CHAT_MODEL } from "@/lib/types";

export const runtime = "nodejs";

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
  /** optional data URL for a vision question attached to this turn */
  imageDataUrl?: string;
}

// OpenAI-style content part types accepted by the CallMissed chat endpoint.
type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function toUpstreamMessages(messages: IncomingMessage[]) {
  return messages.map((m) => {
    if (m.role === "user" && m.imageDataUrl) {
      const content: ContentPart[] = [
        { type: "text", text: m.content || "What is in this image?" },
        { type: "image_url", image_url: { url: m.imageDataUrl } },
      ];
      return { role: m.role, content };
    }
    return { role: m.role, content: m.content };
  });
}

export async function POST(req: NextRequest) {
  let messages: IncomingMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: { message: "messages array is required" } },
        { status: 400 }
      );
    }
  } catch {
    return Response.json(
      { error: { message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${CALLMISSED_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: callmissedHeaders(),
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: toUpstreamMessages(messages),
        stream: true,
      }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Network error";
    return Response.json(
      { error: { message: `Couldn't reach CallMissed: ${detail}` } },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const { status, message } = await describeUpstreamError(upstream);
    return Response.json({ error: { message } }, { status });
  }

  // Pass the upstream SSE stream straight through to the browser. The
  // client parses the same "data: {...}" chunks documented by CallMissed,
  // so no reshaping is needed here — this keeps the route a thin, honest
  // proxy that never lets the API key anywhere near the browser.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
