import { WAMessageKey, proto } from "baileys";
import { getStoredMessage } from "../../services/messages/store";

/**
 * Retrieve a message from the store for Baileys
 * This function is used by Baileys internally for message retrieval
 * @param key The message key to retrieve
 * @returns The message proto if found, otherwise undefined
 */
export async function getMessage(
  key: WAMessageKey
): Promise<proto.IMessage | undefined> {
  try {
    // Validate the key before attempting retrieval
    if (!key.id || !key.remoteJid) {
      return undefined;
    }

    // Try to get the message from the store
    const storedMessage = await getStoredMessage(key);

    if (storedMessage) {
      return storedMessage;
    }

    // Return undefined if not found - Baileys will handle this gracefully
    return undefined;
  } catch (error) {
    // Log the error but don't throw - let Baileys handle the missing message
    console.error("Error retrieving message from store:", error);
    return undefined;
  }
}
