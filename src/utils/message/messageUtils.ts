import { downloadMediaMessage, WAMessage } from "baileys";
import { logger } from "../../config/logger";

// Extract media from message
export async function extractMediaFromMessage(message: WAMessage): Promise<{
  buffer: Buffer;
  type: string;
  mime: string;
  extension: string;
} | null> {
  if (!message.message) return null;

  let type = "";
  let mime = "";
  let extension = "";

  // Check for image
  if (message.message.imageMessage) {
    type = "image";
    mime = message.message.imageMessage.mimetype || "image/jpeg";
    extension = mime.split("/")[1];
  }
  // Check for video
  else if (message.message.videoMessage) {
    type = "video";
    mime = message.message.videoMessage.mimetype || "video/mp4";
    extension = "mp4";
  }
  // Check for document that's image or video
  else if (
    message.message.documentMessage &&
    (message.message.documentMessage.mimetype?.startsWith("image/") ||
      message.message.documentMessage.mimetype?.startsWith("video/"))
  ) {
    type = message.message.documentMessage.mimetype.startsWith("image/")
      ? "image"
      : "video";
    mime = message.message.documentMessage.mimetype;
    extension = mime.split("/")[1];
  } else {
    return null;
  }

  logger.debug(`Processing ${type} with mime ${mime}`);
  const buffer = (await downloadMediaMessage(message, "buffer", {})) as Buffer;
  return { buffer, type, mime, extension };
}
