import { WASocket, WAMessage } from "baileys";
import fs from "fs";
import path from "path";
import { logger } from "../../config/logger";
import { t } from "../../i18n";
import { getFileSizeMB } from "../media/fileUtils";

/**
 * Send a text message as a reply/quote to another message
 */
export async function sendQuoteText(
  socket: WASocket,
  jid: string,
  text: string,
  quotedMessage: WAMessage
): Promise<void> {
  try {
    const result = await socket.sendMessage(
      jid,
      {
        text: text,
      },
      {
        quoted: quotedMessage,
      }
    );

    if (!result) {
      throw new Error("Failed to send quoted text message");
    }

    logger.info("Quoted text message sent successfully");
  } catch (error) {
    logger.error("Error sending quoted text:", error);
    throw error;
  }
}

/**
 * Send an image as a reply/quote to another message
 */
export async function sendQuoteImage(
  socket: WASocket,
  jid: string,
  filePath: string,
  quotedMessage: WAMessage,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await socket.sendMessage(
      jid,
      {
        image: fileBuffer,
        caption: caption,
      },
      {
        quoted: quotedMessage,
      }
    );

    if (!result) {
      throw new Error("Failed to send quoted image message");
    }

    logger.info("Quoted image message sent successfully");

    // Clean up the file after successful sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending quoted image:", error);
    // Don't delete the file if sending failed
    throw error;
  }
}

/**
 * Send an audio file as a reply/quote to another message
 */
export async function sendQuoteAudio(
  socket: WASocket,
  jid: string,
  filePath: string,
  quotedMessage: WAMessage,
  ptt: boolean = false
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await socket.sendMessage(
      jid,
      {
        audio: fileBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: ptt,
      },
      {
        quoted: quotedMessage,
      }
    );

    if (!result) {
      throw new Error("Failed to send quoted audio message");
    }

    logger.info("Quoted audio message sent successfully");

    // Clean up the file after successful sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending quoted audio:", error);
    // Don't delete the file if sending failed
    throw error;
  }
}

/**
 * Send a video as a reply/quote to another message
 */
export async function sendQuoteVideo(
  socket: WASocket,
  jid: string,
  filePath: string,
  quotedMessage: WAMessage,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = getFileSizeMB(filePath);

    logger.debug(`Sending quoted video message: ${fileSizeMB.toFixed(2)} MB`);

    await socket.sendMessage(
      jid,
      {
        video: fileBuffer,
        mimetype: "video/mp4",
        caption: caption,
      },
      {
        quoted: quotedMessage,
      }
    );

    logger.info("Quoted video message sent successfully");

    // Clean up the file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending quoted video:", error);
    // Clean up the file even if sending failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

/**
 * Send a document/file as a reply/quote to another message
 */
export async function sendQuoteDocument(
  socket: WASocket,
  jid: string,
  filePath: string,
  quotedMessage: WAMessage,
  fileName?: string,
  mimetype?: string,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = getFileSizeMB(filePath);
    const actualFileName = fileName || path.basename(filePath);

    logger.debug(
      `Sending quoted document: ${actualFileName} (${fileSizeMB.toFixed(2)} MB)`
    );

    await socket.sendMessage(
      jid,
      {
        document: fileBuffer,
        fileName: actualFileName,
        mimetype: mimetype || "application/octet-stream",
        caption: caption,
      },
      {
        quoted: quotedMessage,
      }
    );

    logger.info("Quoted document sent successfully");

    // Clean up the file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending quoted document:", error);
    // Clean up the file even if sending failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

/**
 * Send a video file (large videos as documents) as a reply/quote to another message
 */
export async function sendQuoteVideoFile(
  socket: WASocket,
  jid: string,
  filePath: string,
  quotedMessage: WAMessage,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = getFileSizeMB(filePath);
    const fileName = path.basename(filePath);

    logger.debug(
      `Sending quoted video file: ${fileName} (${fileSizeMB.toFixed(2)} MB)`
    );

    if (!caption) {
      caption = t("video.videoFileSent", {
        size: fileSizeMB.toFixed(1),
      });
    }

    // Send the video file as a document with quote
    await socket.sendMessage(
      jid,
      {
        document: fileBuffer,
        fileName: fileName,
        mimetype: "video/mp4",
        caption: caption,
      },
      {
        quoted: quotedMessage,
      }
    );

    logger.debug("Quoted video file sent successfully");

    // Clean up the file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending quoted video file:", error);
    // Clean up the file even if sending failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

/**
 * Send a sticker as a reply/quote to another message
 */
export async function sendQuoteSticker(
  socket: WASocket,
  jid: string,
  filePath: string,
  quotedMessage: WAMessage
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await socket.sendMessage(
      jid,
      {
        sticker: fileBuffer,
      },
      {
        quoted: quotedMessage,
      }
    );

    if (!result) {
      throw new Error("Failed to send quoted sticker");
    }

    logger.info("Quoted sticker sent successfully");

    // Clean up the file after successful sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending quoted sticker:", error);
    // Don't delete the file if sending failed
    throw error;
  }
}
