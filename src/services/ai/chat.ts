import { WAMessage, WASocket } from "baileys";
import OpenAI from "openai";
import { ENV } from "../../config";
import { logger } from "../../config/logger";
import { getUserContext, storeUserContext } from "./vectordb";

// Define common interfaces for chat completion
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatContext {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: number;
  }>;
  lastUpdated: number;
}

// Service provider interface - allows for easy switching between different AI providers
interface AIServiceProvider {
  createChatCompletion(messages: ChatMessage[]): Promise<string>;
}

// OpenAI API implementation
class OpenAIProvider implements AIServiceProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: ENV.AI_API_KEY,
      baseURL: ENV.OPENAI_API_URL,
    });
  }

  async createChatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: ENV.OPENAI_MODEL,
        messages: messages,
        temperature: ENV.AI_TEMPERATURE,
        max_completion_tokens: ENV.AI_MAX_COMPLETION_TOKENS,
        top_p: ENV.AI_TOP_P,
      });

      return (
        completion.choices[0]?.message?.content ||
        "I couldn't generate a response. Please try again."
      );
    } catch (error) {
      logger.error("OpenAI API error:", error);
      throw new Error(
        `OpenAI API error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

// Groq API implementation (using OpenAI SDK as Groq uses OpenAI-compatible API)
class GroqProvider implements AIServiceProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: ENV.AI_API_KEY,
      baseURL: ENV.GROQ_API_URL,
    });
  }

  async createChatCompletion(messages: ChatMessage[]): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: ENV.GROQ_MODEL,
        messages: messages,
        temperature: ENV.AI_TEMPERATURE,
        max_completion_tokens: ENV.AI_MAX_COMPLETION_TOKENS,
        top_p: ENV.AI_TOP_P,
      });

      return (
        completion.choices[0]?.message?.content ||
        "I couldn't generate a response. Please try again."
      );
    } catch (error) {
      logger.error("Groq API error:", error);
      throw new Error(
        `Groq API error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

// Factory to create the appropriate AI provider based on configuration
function createAIProvider(): AIServiceProvider {
  const provider = ENV.AI_PROVIDER.toLowerCase();

  if (provider === "groq") {
    logger.info("Using Groq as AI provider");
    return new GroqProvider();
  } else {
    // Default to OpenAI
    logger.info("Using OpenAI as AI provider");
    return new OpenAIProvider();
  }
}

// Get or create the AI provider (singleton pattern)
let aiProvider: AIServiceProvider | null = null;

function getAIProvider(): AIServiceProvider {
  if (!aiProvider) {
    aiProvider = createAIProvider();
  }
  return aiProvider;
}

// Process chat messages with AI
export async function processAIChat(
  socket: WASocket,
  message: WAMessage,
  text: string
): Promise<void> {
  try {
    const jid = message.key.remoteJid!;
    const isGroup = jid.endsWith("@g.us");
    const contextId = isGroup ? jid : message.key.participant || jid;

    // Get typing indicator
    await socket.sendPresenceUpdate("composing", jid);

    // Get the appropriate history limit based on chat type
    const historyLimit = isGroup
      ? ENV.GROUP_CHAT_HISTORY_LIMIT
      : ENV.PRIVATE_CHAT_HISTORY_LIMIT;

    // Retrieve context (will get either group or private chat context)
    const context = await getUserContext(contextId, historyLimit);

    logger.info(`Processing ${isGroup ? "group" : "private"} chat message`, {
      chatId: jid,
      contextLength: context ? context.split(" ").length : 0,
      historyLimit,
    }); // Create the chat messages array with enhanced context awareness
    const chatMessages: ChatMessage[] = [
      {
        role: "system",
        content:
          ENV.BOT_SYSTEM_PROMPT.replace("${BOT_NAME}", ENV.BOT_NAME) +
          (isGroup
            ? ` You are in a group chat. The current message is from ${
                message.pushName || "a group member"
              } (${message.key.participant || "unknown ID"}).`
            : " This is a private chat.") +
          (context ? `\n\n${context}` : ""),
      },
      {
        role: "user",
        content: text,
      },
    ];

    // Get the AI provider
    const provider = getAIProvider();

    // Call the AI API
    const aiResponse = await provider.createChatCompletion(chatMessages);

    // Clear typing indicator
    await socket.sendPresenceUpdate("available", jid); // Store the context with the appropriate ID and sender information for groups
    if (isGroup) {
      const sender = {
        id: message.key.participant || "unknown",
        name: message.pushName || undefined,
      };
      await storeUserContext(contextId, text, aiResponse, sender);
    } else {
      await storeUserContext(contextId, text, aiResponse);
    }

    // Send the response back to the user
    await socket.sendMessage(jid, { text: aiResponse }, { quoted: message });
  } catch (error) {
    logger.error("Error processing AI chat:", {
      error: error instanceof Error ? error.message : String(error),
      jid: message.key.remoteJid,
      isGroup: message.key.remoteJid?.endsWith("@g.us"),
    });

    const jid = message.key.remoteJid!;
    await socket.sendPresenceUpdate("available", jid);
    await socket.sendMessage(
      jid,
      {
        text: "Sorry, I encountered an error while processing your message. Please try again later.",
      },
      { quoted: message }
    );
  }
}

export default processAIChat;
