export type Role = "user" | "assistant";

export type MessageKind = "text" | "image";

export interface ImageAttachment {
  /** data URL, e.g. data:image/png;base64,... */
  dataUrl: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  kind: MessageKind;
  /** text content (markdown for assistant replies) */
  content: string;
  /** user-attached image for vision questions */
  inputImage?: ImageAttachment;
  /** generated image, base64 data URL, present when kind === "image" */
  imageUrl?: string;
  /** true while a streaming response is still arriving */
  streaming?: boolean;
  /** set when this message represents a failed request */
  error?: string;
  createdAt: number;
}

/** Shape CallMissed (OpenAI-compatible) uses for its error responses. */
export interface CallMissedErrorBody {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

export const CHAT_MODEL = "kimi-k2.7-code";
export const IMAGE_MODEL = "flux-2-klein-9b";
