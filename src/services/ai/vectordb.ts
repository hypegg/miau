import { logger } from "../../config/logger";

interface UserContextEntry {
  userId: string; // Group ID or user ID
  senderId?: string; // Individual sender ID (for group chats)
  senderName?: string; // Sender name if available (for group chats)
  userMessage: string;
  botResponse: string;
  timestamp: number;
}

// In-memory storage for the vector database (placeholder)
// In a real implementation, you would use a proper vector database
const contextDatabase: UserContextEntry[] = [];

// Store user interaction in the vector database
export async function storeUserContext(
  userId: string,
  userMessage: string,
  botResponse: string,
  sender?: { id: string; name?: string }
): Promise<void> {
  try {
    const isGroup = userId.endsWith("@g.us");
    const contextEntry: UserContextEntry = {
      userId,
      userMessage,
      botResponse,
      timestamp: Date.now(),
      ...(isGroup && sender
        ? {
            senderId: sender.id,
            senderName: sender.name,
          }
        : {}),
    };

    // Add to the database
    contextDatabase.push(contextEntry);

    logger.debug(`Stored context for ${isGroup ? "group" : "user"}`, {
      chatId: userId,
      senderId: sender?.id,
      senderName: sender?.name,
    });
  } catch (error) {
    logger.error("Error storing context:", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      isGroup: userId.endsWith("@g.us"),
    });
  }
}

// Get user or group context from the vector database
export async function getUserContext(
  userId: string,
  limit?: number
): Promise<string | null> {
  try {
    const isGroup = userId.endsWith("@g.us");

    // Get all entries for this user/group
    const entries = contextDatabase
      .filter((entry) => entry.userId === userId)
      // Sort by timestamp, most recent first
      .sort((a, b) => b.timestamp - a.timestamp)
      // Take the specified number of entries
      .slice(0, limit || 5);

    if (entries.length === 0) {
      return null;
    }

    // Format the context differently for groups vs private chats
    const contextStr = entries
      .map((entry) => {
        if (isGroup) {
          const sender = entry.senderName || entry.senderId || "Unknown member";
          return `Group member (${sender}): "${entry.userMessage}"\nBot: "${entry.botResponse}"`;
        }
        return `User: "${entry.userMessage}"\nBot: "${entry.botResponse}"`;
      })
      .join("\n\n");

    return `Recent ${
      isGroup ? "group" : "conversation"
    } history:\n${contextStr}`;
  } catch (error) {
    logger.error("Error getting context:", {
      error: error instanceof Error ? error.message : String(error),
      userId,
      isGroup: userId.endsWith("@g.us"),
    });
    return null;
  }
}

export default {
  storeUserContext,
  getUserContext,
};
