import "server-only";
import type { CallMissedErrorBody } from "./types";

export const CALLMISSED_BASE_URL = "https://api.callmissed.com/v1";

/**
 * Reads the API key from the environment. Throws instead of returning
 * undefined so every route fails loudly and early if setup is incomplete,
 * rather than sending "Bearer undefined" to the upstream API.
 */
export function getApiKey(): string {
  const key = process.env.CALLMISSED_API_KEY;
  if (!key) {
    throw new Error(
      "CALLMISSED_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return key;
}

export function callmissedHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Turns CallMissed's OpenAI-compatible error body + HTTP status into a short,
 * human-readable message the UI can show directly in a chat bubble.
 */
export async function describeUpstreamError(
  res: Response
): Promise<{ status: number; message: string }> {
  let message = `Request failed (${res.status}).`;

  try {
    const body = (await res.json()) as CallMissedErrorBody;
    if (body?.error?.message) {
      message = body.error.message;
    }
    if (body?.error?.code === "unsupported_image_input") {
      message =
        "This model can't read images. Try again without the attachment, or ask a text question instead.";
    }
  } catch {
    // upstream didn't return JSON — fall back to a status-based message below
  }

  switch (res.status) {
    case 401:
      message = "Your CallMissed API key was rejected. Check CALLMISSED_API_KEY in .env.local.";
      break;
    case 402:
      message = "You're out of CallMissed credits for this model.";
      break;
    case 403:
      message = "Your API key doesn't have permission for this request. It needs the llm and image scopes.";
      break;
    case 429:
      message = "You're sending requests too fast. Wait a moment and try again.";
      break;
  }

  return { status: res.status, message };
}
