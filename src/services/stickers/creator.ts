/** Service for converting images and videos into WhatsApp-compatible WebP stickers */

import { WAMessage, WASocket } from "baileys";
import fs from "fs";
import path from "path";
import { logger } from "../../config/logger";
import t from "../../i18n";
import Sticker, { StickerTypes } from "./stickerFormater";
import {
  extractMediaFromMessage,
  sendQuoteSticker,
  sendQuoteText,
} from "../../utils/message";
import { ENV } from "../../config";
import { generateFileName } from "../../utils/media";

const STICKER_ID = "1025"; // Default sticker ID
const STICKER_QUALITY = 80;

// Path for storing temporary files
const TEMP_MEDIA_PATH = path.join(__dirname, "../../../storage/media");
const STICKER_PATH = path.join(TEMP_MEDIA_PATH, "stickers");

// Ensures required directories exist for sticker processing
function ensureDirectoriesExist(): void {
  if (!fs.existsSync(TEMP_MEDIA_PATH)) {
    fs.mkdirSync(TEMP_MEDIA_PATH, { recursive: true });
  }

  if (!fs.existsSync(STICKER_PATH)) {
    fs.mkdirSync(STICKER_PATH, { recursive: true });
  }
}

// Initialize directories
ensureDirectoriesExist();

/** Creates a static or animated sticker from image or video media */
export async function createSticker(
  socket: WASocket,
  message: WAMessage
): Promise<void> {
  const jid = message.key.remoteJid!;
  let stickerFilePath = "";

  try {
    // extract media from the message
    const mediaData = await extractMediaFromMessage(message);

    if (!mediaData) {
      await sendQuoteText(socket, jid, t("sticker.noMedia"), message);
      return;
    }

    const { buffer, type, mime, extension } = mediaData;

    const sticker = new Sticker(buffer, {
      pack: ENV.BOT_NAME,
      author: message.pushName || "Unknown",
      type: StickerTypes.DEFAULT,
      id: STICKER_ID,
      quality: STICKER_QUALITY,
    });

    logger.debug("Creating sticker with options:", {
      pack: ENV.BOT_NAME,
      author: message.pushName || "Unknown",
      type: StickerTypes.DEFAULT,
      id: STICKER_ID,
      quality: STICKER_QUALITY,
    });

    const outputFileName = generateFileName("sticker", extension);

    logger.debug("Output file name:", outputFileName);

    stickerFilePath = path.join(STICKER_PATH, outputFileName);
    await sticker.toFile(stickerFilePath);

    logger.debug("Sticker created at:", stickerFilePath);

    sendQuoteSticker(socket, jid, stickerFilePath, message);

    logger.debug("Sticker sent successfully");
  } catch (error) {
    logger.error(`Error creating sticker: ${error}`);
  }
}

export default {
  createSticker,
};
// Note: The above code assumes that you have ffmpeg installed and available in your PATH.
