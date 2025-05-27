import { downloadMediaMessage, WAMessage } from "baileys";
import { logger } from "../../config/logger";

export interface MediaData {
  buffer: Buffer;
  type: string; // "image" or "video"
  mime: string; // e.g., "image/jpeg", "video/mp4"
  extension: string; // e.g., "jpeg", "mp4"
}

// Extract media from message
export async function extractMediaFromMessage(
  message: WAMessage
): Promise<MediaData | null> {
  if (!message.message) return null;

  logger.debug("Extracting media from message...");

  let type = "";
  let mime = "";
  let extension = "";

  // Check for image
  if (message.message.imageMessage) {
    type = "image";
    mime = message.message.imageMessage.mimetype || "image/jpeg";
    extension = mime.split("/")[1] || "jpeg";
  }
  // Check for video
  else if (message.message.videoMessage) {
    type = "video";
    mime = message.message.videoMessage.mimetype || "video/mp4";
    extension = mime.split("/")[1] || "mp4";
  }
  // Check for document that's image or video
  else if (
    message.message.documentMessage &&
    (message.message.documentMessage.mimetype?.startsWith("image/") ||
      message.message.documentMessage.mimetype?.startsWith("video/"))
  ) {
    if (message.message.documentMessage.mimetype?.startsWith("image/")) {
      type = "image";
      mime = message.message.documentMessage.mimetype;
      extension = mime.split("/")[1] || "jpeg";
    } else {
      type = "video";
      mime = message.message.documentMessage.mimetype;
      extension = mime.split("/")[1] || "mp4";
    }
  } else {
    logger.warn("No valid image or video found in the message.");
    return null;
  }

  logger.debug(`Processing ${type} with mime ${mime}`);
  try {
    const buffer = (await downloadMediaMessage(
      message,
      "buffer",
      {}
    )) as Buffer;
    if (!buffer || buffer.length === 0) {
      logger.warn("Downloaded media buffer is empty or null.");
      return null;
    }
    return { buffer, type, mime, extension };
  } catch (error) {
    logger.error("Failed to download media message:", error);
    return null;
  }
}
