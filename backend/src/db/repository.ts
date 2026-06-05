import { v4 as uuidv4 } from "uuid";
import { getDb } from "./migrate";

export interface Conversation {
  id: string;
  created_at: string;
  metadata?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: "user" | "ai";
  text: string;
  created_at: string;
}

export function createConversation(metadata?: Record<string, unknown>): Conversation {
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `INSERT INTO conversations (id, metadata) VALUES (?, ?)`
  ).run(id, metadata ? JSON.stringify(metadata) : null);
  const conv = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id) as Conversation;
  db.close();
  return conv;
}

export function getConversation(id: string): Conversation | undefined {
  const db = getDb();
  const conv = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id) as Conversation | undefined;
  db.close();
  return conv;
}

export function saveMessage(
  conversationId: string,
  sender: "user" | "ai",
  text: string
): Message {
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, sender, text) VALUES (?, ?, ?, ?)`
  ).run(id, conversationId, sender, text);
  const msg = db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id) as Message;
  db.close();
  return msg;
}

export function getMessagesByConversation(conversationId: string): Message[] {
  const db = getDb();
  const msgs = db
    .prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`)
    .all(conversationId) as Message[];
  db.close();
  return msgs;
}
