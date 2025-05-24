import { WAMessage, WASocket } from "baileys";
import { logger } from "../config/logger";
import { processAIChat, shouldProcessMessage } from "../services/ai";
import { handleCommand } from "./commandHandler";

/**
 * Extract message content from various message types
 */
const getMessageContent = (message: WAMessage): string | null => {
  return (
    message?.message?.conversation ||
    message?.message?.extendedTextMessage?.text ||
    message?.message?.imageMessage?.caption ||
    message?.message?.videoMessage?.caption ||
    message?.message?.documentMessage?.caption ||
    null
  );
};

/**
 * Get the message type from the message object
 */
const getMessageType = (message: WAMessage): string => {
  if (!message.message) return "unknown";
  return Object.keys(message.message)[0] || "unknown";
};

/**
 * Format timestamp from message
 */
const formatTimestamp = (message: WAMessage): string => {
  if (typeof message.messageTimestamp === "number") {
    return new Date(message.messageTimestamp * 1000).toISOString();
  }
  return new Date().toISOString();
};

/**
 * Check if the message text is a command
 */
const isCommand = (text: string): boolean => {
  return text.startsWith("/");
};

/**
 * Handles incoming messages and routes them appropriately
 */
export const messageHandler = async (
  socket: WASocket,
  message: WAMessage
): Promise<void> => {
  try {
    // Skip status broadcasts
    if (message.key.remoteJid === "status@broadcast") return;

    // Only process messages from others (not sent by the bot)
    if (!message.key.fromMe && message.key.remoteJid) {
      const jid = message.key.remoteJid;
      const text = getMessageContent(message);

      // Case 1: Message has text content
      if (text !== null) {
        const userId = message.key.participant || jid;
        const messageType = getMessageType(message);
        const timestamp = formatTimestamp(message);
        const isGroup = jid.endsWith("@g.us");

        // Check if it's a command
        if (isCommand(text)) {
          await handleCommand(socket, message, text);
        } else {
          // WhatsApp-specific logging
          logger.whatsapp(
            [
              "Message Received:",
              `  Type: ${messageType}`,
              `  From: ${userId}`,
              `  Chat: ${jid}`,
              `  Group: ${isGroup}`,
              `  Time: ${timestamp}`,
            ].join("\n"),
            { content: text }
          );

          // For all chats, validate if we should process this message
          const shouldRespond = await shouldProcessMessage(
            socket,
            message,
            text
          );

          if (!shouldRespond && isGroup) {
            logger.whatsapp(
              "Skipping group message due to configuration settings"
            );
            return;
          }

          // Process the message with AI
          //await processAIChat(socket, message, text);
        }
      }
    }
  } catch (error) {
    logger.error("Error handling message:", {
      error: error instanceof Error ? error.message : String(error),
      jid: message.key.remoteJid,
    });
  }
};

export default messageHandler;
