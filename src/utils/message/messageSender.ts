import { WASocket } from "baileys";
import fs from "fs";
import path from "path";
import { logger } from "../../config/logger";
import { t } from "../../i18n";
import { getFileSizeMB } from "../media/fileUtils";

// Send downloaded audio to user
export async function sendAudio(
  socket: WASocket,
  jid: string,
  filePath: string,
  ptt: boolean = false // Set to true for push-to-talk audio
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await socket.sendMessage(jid, {
      audio: fileBuffer,
      mimetype: "audio/ogg; codecs=opus",
      ptt: ptt,
    });

    if (!result) {
      throw new Error("Failed to send audio message");
    }

    logger.info("Audio message sent successfully");

    // Clean up the file after successful sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending audio:", error);
    // Don't delete the file if sending failed
    throw error;
  }
}

// Send downloaded video to user (video message for small files)
export async function sendVideo(
  socket: WASocket,
  jid: string,
  filePath: string,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = getFileSizeMB(filePath);

    logger.debug(`Sending video message: ${fileSizeMB.toFixed(2)} MB`);

    await socket.sendMessage(jid, {
      video: fileBuffer,
      mimetype: "video/mp4",
      caption: caption,
    });

    logger.info("Video message sent successfully");

    // Clean up the file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending video:", error);
    // Clean up the file even if sending failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

// Send downloaded video file (for large videos)
export async function sendVideoFile(
  socket: WASocket,
  jid: string,
  filePath: string,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileSizeMB = getFileSizeMB(filePath);
    const fileName = path.basename(filePath);

    logger.debug(
      `Sending video file: ${fileName} (${fileSizeMB.toFixed(2)} MB)`
    );

    if (!caption) {
      caption = t("video.videoFileSent", {
        size: fileSizeMB.toFixed(1),
      });
    }

    // Send the video file as a document
    await socket.sendMessage(jid, {
      document: fileBuffer,
      fileName: fileName,
      mimetype: "video/mp4",
      caption: caption,
    });

    logger.debug("Video file sent successfully");

    // Clean up the file after sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending video file:", error);
    // Clean up the file even if sending failed
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

// Send image to user
export async function sendImage(
  socket: WASocket,
  jid: string,
  filePath: string,
  caption?: string
): Promise<void> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const result = await socket.sendMessage(jid, {
      image: fileBuffer,
      caption: caption,
    });

    if (!result) {
      throw new Error("Failed to send image message");
    }

    logger.info("Image message sent successfully");

    // Clean up the file after successful sending
    fs.unlinkSync(filePath);
  } catch (error) {
    logger.error("Error sending image:", error);
    // Don't delete the file if sending failed
    throw error;
  }
}
