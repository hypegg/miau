import { WAMessageKey, proto } from "baileys";
import { LRUCache } from "lru-cache";
import { logger } from "../../config/logger";

// Create an LRU cache to store messages to prevent memory leaks
const messageStore = new LRUCache<string, proto.IMessage>({
  max: 1000, // Store up to 1000 messages
  ttl: 1000 * 60 * 60, // Messages expire after 1 hour
  updateAgeOnGet: true, // Update the "freshness" when messages are retrieved
});

/**
 * Format a message key into a string for storage
 */
function formatKey(key: WAMessageKey): string {
  return `${key.remoteJid}:${key.id}`;
}

/**
 * Store a message in the cache
 * This function matches Baileys' expected signature for message storage
 */
export function storeMessage(
  key: WAMessageKey,
  message: proto.IMessage | undefined
): void {
  try {
    // Only store if message exists and has content
    if (!message || !key.id || !key.remoteJid) {
      return;
    }

    const storeKey = formatKey(key);
    messageStore.set(storeKey, message);
    logger.debug(`Stored message with key: ${storeKey}`);
  } catch (error) {
    logger.error("Error storing message:", error);
  }
}

/**
 * Get a message from the cache
 * This function should return the exact message proto, not WAMessageContent
 */
export async function getStoredMessage(
  key: WAMessageKey
): Promise<proto.IMessage | undefined> {
  try {
    const storeKey = formatKey(key);
    const message = messageStore.get(storeKey);
    if (message) {
      logger.debug(`Retrieved message with key: ${storeKey}`);
      return message;
    }
    logger.debug(`Message not found for key: ${storeKey}`);
    return undefined;
  } catch (error) {
    logger.error("Error retrieving message:", error);
    return undefined;
  }
}

export async function deleteStoreMessage(key: WAMessageKey): Promise<void> {
  try {
    if (!key.id || !key.remoteJid) {
      return;
    }
    const storeKey = formatKey(key);
    const deleted = messageStore.delete(storeKey);
    if (deleted) {
      logger.debug(`Deleted message with key: ${storeKey}`);
    } else {
      logger.debug(`No message found to delete for key: ${storeKey}`);
    }
  } catch (error) {
    logger.error("Error deleting message:", error);
  }
}

// Export for backward compatibility
export { getStoredMessage as getMessage };
