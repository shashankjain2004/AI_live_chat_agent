import Groq from "groq-sdk";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------
const PROVIDER: "groq" | "anthropic" =
  (process.env.LLM_PROVIDER as "groq" | "anthropic") ||
  (process.env.GROQ_API_KEY ? "groq" : "anthropic");

// Log on startup so it's obvious which provider + whether key is present
console.log(`[LLM] Provider: ${PROVIDER}`);
console.log(`[LLM] GROQ_API_KEY set: ${!!process.env.GROQ_API_KEY}`);
console.log(`[LLM] ANTHROPIC_API_KEY set: ${!!process.env.ANTHROPIC_API_KEY}`);

const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORE_KNOWLEDGE = `
You are a helpful, friendly support agent for "Bloom & Ship" — a small e-commerce store that sells handcrafted home goods and gifts.

== STORE KNOWLEDGE BASE ==

PRODUCTS:
- Handcrafted candles, ceramics, textiles, and decor
- Price range: $12–$180
- All items are made by independent artisans

SHIPPING POLICY:
- Standard shipping: 5–7 business days (free on orders over $50, otherwise $4.99)
- Express shipping: 2–3 business days ($12.99)
- Overnight shipping: Next business day ($24.99)
- We ship to the US, Canada, UK, Australia, and most of Europe
- International orders (non-US): 10–15 business days, duties may apply
- Orders placed before 2 PM EST on weekdays are processed same day

RETURN & REFUND POLICY:
- 30-day hassle-free returns from delivery date
- Items must be unused and in original packaging
- To initiate a return, email returns@bloomandship.com with your order number
- Refunds are processed within 5–7 business days of receiving the returned item
- Damaged or defective items: full refund or free replacement, no return needed — just send a photo
- Sale/clearance items are final sale and cannot be returned
- Custom or personalized items cannot be returned unless defective

ORDER MANAGEMENT:
- Orders can be cancelled within 1 hour of placement
- To cancel, contact support@bloomandship.com immediately
- Once shipped, cancellation is not possible — initiate a return instead
- Track orders via the link in your shipping confirmation email

PAYMENTS:
- Accepted: Visa, Mastercard, Amex, PayPal, Apple Pay, Shop Pay
- Payment is charged at time of order, not shipment
- Prices are in USD

SUPPORT HOURS:
- Monday–Friday: 9 AM – 6 PM EST
- Saturday: 10 AM – 3 PM EST
- Sunday: Closed
- Email: support@bloomandship.com
- Response time: within 24 hours on business days

PROMOTIONS:
- Sign up for the newsletter for 10% off your first order
- Seasonal sales in November (Black Friday) and January (clearance)

== END KNOWLEDGE BASE ==

Tone guidelines:
- Be warm, concise, and helpful
- If you don't know something specific (like a customer's exact order status), acknowledge it and direct them to the right channel
- Never make up information not in the knowledge base
- Keep answers focused and not overly long
`;

const MAX_HISTORY_MESSAGES = 20;
const MAX_INPUT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 512;

export async function generateReply(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const safeMessage = userMessage.slice(0, MAX_INPUT_CHARS);
  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  const messages = [
    ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: safeMessage },
  ];

  try {
    if (PROVIDER === "groq" && groqClient) {
      return await callGroq(groqClient, messages);
    } else if (PROVIDER === "anthropic" && anthropicClient) {
      return await callAnthropic(anthropicClient, messages);
    } else {
      throw new LLMError(
        "authentication",
        `No LLM provider configured. Provider="${PROVIDER}", GROQ_API_KEY set=${!!process.env.GROQ_API_KEY}, ANTHROPIC_API_KEY set=${!!process.env.ANTHROPIC_API_KEY}. Add your key to backend/.env`
      );
    }
  } catch (err: unknown) {
    if (err instanceof LLMError) throw err;
    // Log the raw error so it's visible in the backend terminal
    console.error("[LLM] Unexpected error:", err);
    if (err instanceof Error && err.message.toLowerCase().includes("timeout")) {
      throw new LLMError("timeout", "The request timed out. Please try again.");
    }
    throw new LLMError("unknown", "Something went wrong while generating a response. Please try again.");
  }
}

async function callGroq(
  client: Groq,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: STORE_KNOWLEDGE },
        ...messages,
      ],
    });
    return response.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
  } catch (err: unknown) {
    console.error("[LLM] Groq error:", err);
    if (err instanceof Groq.APIError) {
      console.error(`[LLM] Groq status=${err.status} message=${err.message}`);
      if (err.status === 401) throw new LLMError("authentication", "Invalid Groq API key — please check your backend/.env file.");
      if (err.status === 429) throw new LLMError("rate_limit", "We're experiencing high demand. Please try again in a moment.");
      if (err.status && err.status >= 500) throw new LLMError("provider_error", "The AI service is temporarily unavailable. Please try again shortly.");
    }
    throw err;
  }
}

async function callAnthropic(
  client: Anthropic,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: MAX_OUTPUT_TOKENS,
      system: STORE_KNOWLEDGE,
      messages,
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text in response");
    return textBlock.text;
  } catch (err: unknown) {
    console.error("[LLM] Anthropic error:", err);
    if (err instanceof Anthropic.APIError) {
      console.error(`[LLM] Anthropic status=${err.status} message=${err.message}`);
      if (err.status === 401) throw new LLMError("authentication", "Invalid Anthropic API key — please check your backend/.env file.");
      if (err.status === 429) throw new LLMError("rate_limit", "We're experiencing high demand. Please try again in a moment.");
      if (err.status && err.status >= 500) throw new LLMError("provider_error", "The AI service is temporarily unavailable. Please try again shortly.");
    }
    throw err;
  }
}

export class LLMError extends Error {
  constructor(
    public readonly code: "authentication" | "rate_limit" | "provider_error" | "timeout" | "unknown",
    public readonly userMessage: string
  ) {
    super(userMessage);
    this.name = "LLMError";
  }
}
