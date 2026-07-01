import { NextRequest } from "next/server";
import {
  CALLMISSED_BASE_URL,
  callmissedHeaders,
  describeUpstreamError,
} from "@/lib/callmissed";
import { IMAGE_MODEL } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let prompt: string;
  try {
    const body = await req.json();
    prompt = (body.prompt ?? "").trim();
    if (!prompt) {
      return Response.json(
        { error: { message: "A prompt is required." } },
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
    upstream = await fetch(`${CALLMISSED_BASE_URL}/images/generations`, {
      method: "POST",
      headers: callmissedHeaders(),
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Network error";
    return Response.json(
      { error: { message: `Couldn't reach CallMissed: ${detail}` } },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    const { status, message } = await describeUpstreamError(upstream);
    return Response.json({ error: { message } }, { status });
  }

  const data = await upstream.json();
  const b64 = data?.data?.[0]?.b64_json;

  if (!b64) {
    return Response.json(
      { error: { message: "CallMissed didn't return an image. Try a different prompt." } },
      { status: 502 }
    );
  }

  return Response.json({ imageUrl: `data:image/png;base64,${b64}` });
}
