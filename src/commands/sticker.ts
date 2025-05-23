import { WAMessage, WASocket } from "baileys";
import { logger } from "../config/logger";
import { createSticker } from "../services/stickers";
import t from "../i18n";

export async function handleStickerCommand(
  socket: WASocket,
  message: WAMessage
): Promise<void> {
  try {
    const jid = message.key.remoteJid!;
    let targetMessage = message;

    // Check if the message is a reply to another message
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      logger.debug("Processing quoted message for sticker creation");
      // Use the quoted message as the target for sticker creation
      const quotedMessage = {
        ...message,
        message:
          message.message?.extendedTextMessage?.contextInfo?.quotedMessage,
      };
      targetMessage = quotedMessage as WAMessage;
    }
    // Check if the message mentions another message
    else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
      logger.debug("Processing mentioned message for sticker creation");

      // Get the message quoted or referenced in the mention
      const quotedMessageContext =
        message.message?.extendedTextMessage?.contextInfo;
      if (quotedMessageContext?.quotedMessage) {
        logger.debug("Found quoted message in mention context");
        targetMessage = {
          key: {
            remoteJid: jid,
            id: quotedMessageContext.stanzaId,
            participant: quotedMessageContext.participant,
          },
          message: quotedMessageContext.quotedMessage,
        } as WAMessage;
      } else {
        logger.warn("No quoted message found in mention context");
        await socket.sendMessage(jid, {
          text: t("sticker.noMediaInMention"),
        });
        return;
      }
    }

    // Check if the target message contains media
    if (
      !targetMessage.message?.imageMessage &&
      !targetMessage.message?.videoMessage &&
      !targetMessage.message?.documentMessage
    ) {
      await socket.sendMessage(jid, {
        text: t("sticker.noMedia"),
      });
      return;
    }

    await socket.sendMessage(jid, {
      text: t("sticker.creating"),
    });

    // Create and send the sticker
    await createSticker(socket, targetMessage);
  } catch (error) {
    logger.error("Error handling sticker command:", error);
    const jid = message.key.remoteJid!;
    await socket.sendMessage(jid, {
      text: t("sticker.error"),
    });
  }
}
