import { WAMessage, WASocket } from "baileys";
import { logger } from "../config/logger";
import t from "../i18n";
import { createSticker } from "../services/stickers";

export async function handleStickerCommand(
  socket: WASocket,
  message: WAMessage,
  args: string[]
): Promise<void> {
  const jid = message.key.remoteJid!;

  try {
    let targetMessage = message;

    // Extract target message (quoted or mentioned)
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      logger.debug("Processing quoted message for sticker creation");
      targetMessage = {
        ...message,
        message: message.message.extendedTextMessage.contextInfo.quotedMessage,
      } as WAMessage;
    } else if (
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid
    ) {
      logger.debug("Processing mentioned message for sticker creation");
      const quotedMessageContext =
        message.message.extendedTextMessage.contextInfo;

      if (quotedMessageContext?.quotedMessage) {
        targetMessage = {
          key: {
            remoteJid: jid,
            id: quotedMessageContext.stanzaId,
            participant: quotedMessageContext.participant,
          },
          message: quotedMessageContext.quotedMessage,
        } as WAMessage;
      } else {
        await socket.sendMessage(jid, { text: t("sticker.noMediaInMention") });
        return;
      }
    }

    // Pre-validate media presence
    if (
      !targetMessage.message?.imageMessage &&
      !targetMessage.message?.videoMessage &&
      !targetMessage.message?.documentMessage
    ) {
      await socket.sendMessage(jid, { text: t("sticker.noMedia") });
      return;
    }

    // Send processing message
    await socket.sendMessage(jid, { text: t("sticker.creating") });

    // Create and send the sticker
    await createSticker(socket, targetMessage, message, args);
  } catch (error) {
    logger.error("Error handling sticker command:", error);
    await socket.sendMessage(jid, { text: t("sticker.error") });
  }
}
