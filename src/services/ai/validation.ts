import { WAMessage, WASocket } from "baileys";
import { ENV } from "../../config";
import { logger } from "../../config/logger";

/**
 * Validates if a message should be processed by the AI
 * Handles validation for both group and private chats
 */
export async function shouldProcessMessage(
  socket: WASocket,
  message: WAMessage,
  text: string
): Promise<boolean> {
  const jid = message.key.remoteJid!;
  const isGroup = jid.endsWith("@g.us");

  logger.debug(`Processing message validation for chat ${jid}`);
  logger.debug(`Is group chat: ${isGroup}`);

  // If it's not a group chat, always process the message
  if (!isGroup) {
    logger.debug("Not a group chat - processing message");
    return true;
  }

  return await validateGroupMessage(socket, message, text);
}

/**
 * Validates if a group message should be processed by the AI
 */
async function validateGroupMessage(
  socket: WASocket,
  message: WAMessage,
  text: string
): Promise<boolean> {
  const jid = message.key.remoteJid!;

  logger.debug(`Validating group message in ${jid}`);

  // Check if group chat is enabled
  if (!ENV.GROUP_CHAT_ENABLED) {
    logger.debug("Group chat is globally disabled - skipping message");
    return false;
  }

  // Check whitelist if enabled
  if (!ENV.GROUP_WHITELIST_ENABLED) {
    logger.debug(`Checking group whitelist. Group: ${jid}`);
    if (!ENV.GROUP_WHITELIST.includes(jid)) {
      logger.debug("Group not in whitelist - skipping message");
      return false;
    }
    logger.debug("Group found in whitelist");
  }

  // Get bot's number for mention detection
  const botNumber = socket.user?.id?.split(":")[0] || "";
  const botFullJid = `${botNumber}@s.whatsapp.net`;
  logger.debug(`Bot JID for mention detection: ${botFullJid}`);

  // Check if message is quoting the bot's message
  const isQuotingBot =
    message.message?.extendedTextMessage?.contextInfo?.participant ===
    botFullJid;
  logger.debug(`Is quoting bot: ${isQuotingBot}`);

  // Check if bot is mentioned (@tag), referenced with trigger words, or explicitly mentioned
  const isMentioned = text.includes(`@${botNumber}`);
  const mentionedInMessage =
    message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(
      botFullJid
    );
  const hasAnyTriggerWord = ENV.GROUP_TRIGGER_WORDS.some((word) =>
    text.toLowerCase().includes(word)
  );
  const containsBotName = text
    .toLowerCase()
    .includes(ENV.BOT_NAME.toLowerCase());

  logger.debug(`Mention checks:
    - Direct @mention: ${isMentioned}
    - Mentioned in message: ${mentionedInMessage}
    - Has trigger word: ${hasAnyTriggerWord}
    - Contains bot name: ${containsBotName}
  `);

  // Return true if any of the trigger conditions are met
  const shouldProcess =
    isMentioned ||
    mentionedInMessage ||
    hasAnyTriggerWord ||
    containsBotName ||
    isQuotingBot;

  logger.debug(`Final validation result: ${shouldProcess}`);
  return shouldProcess;
}
