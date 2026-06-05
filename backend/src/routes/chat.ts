import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createConversation,
  getConversation,
  getMessagesByConversation,
  saveMessage,
} from "../db/repository";
import { generateReply, LLMError, type ChatMessage } from "../services/llm";

const router = Router();

const MAX_MESSAGE_LENGTH = 2000;

const ChatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(MAX_MESSAGE_LENGTH, `Message must be under ${MAX_MESSAGE_LENGTH} characters`),
  sessionId: z.string().uuid().optional(),
});

// POST /chat/message
router.post(
  "/message",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Validate input
    const parsed = ChatMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues.map((i) => i.message),
      });
      return;
    }

    const { message, sessionId } = parsed.data;

    try {
      // Resolve or create conversation
      let conversationId: string;
      if (sessionId) {
        const existing = getConversation(sessionId);
        if (!existing) {
          // Session not found — create new one silently
          const conv = createConversation();
          conversationId = conv.id;
        } else {
          conversationId = sessionId;
        }
      } else {
        const conv = createConversation();
        conversationId = conv.id;
      }

      // Persist user message
      saveMessage(conversationId, "user", message);

      // Build history for LLM (exclude the message we just saved — it's passed separately)
      const allMessages = getMessagesByConversation(conversationId);
      // All messages except the last one (which we just saved)
      const history: ChatMessage[] = allMessages
        .slice(0, -1)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      // Generate AI reply
      const reply = await generateReply(history, message);

      // Persist AI message
      saveMessage(conversationId, "ai", reply);

      res.json({ reply, sessionId: conversationId });
    } catch (err) {
      if (err instanceof LLMError) {
        res.status(503).json({
          error: "AI service error",
          message: err.userMessage,
          code: err.code,
        });
        return;
      }
      next(err);
    }
  }
);

// GET /chat/history/:sessionId
router.get(
  "/history/:sessionId",
  (req: Request, res: Response): void => {
    const { sessionId } = req.params;

    // Validate UUID format loosely
    if (!sessionId || sessionId.length < 10) {
      res.status(400).json({ error: "Invalid session ID" });
      return;
    }

    const conversation = getConversation(sessionId);
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const messages = getMessagesByConversation(sessionId);
    res.json({ sessionId, messages });
  }
);

export default router;
