import { WAMessage, WASocket } from "baileys";
import { logger } from "../config/logger";
import {
  downloadYouTubeMedia,
  sendVideo,
  sendVideoFile,
} from "../services/media";
import t from "../i18n";

export async function handleVideoCommand(
  socket: WASocket,
  message: WAMessage,
  args: string[]
): Promise<void> {
  try {
    const jid = message.key.remoteJid!;

    if (args.length === 0) {
      await socket.sendMessage(jid, {
        text: t("video.noUrl"),
      });
      return;
    }

    const url = args[0];

    await socket.sendMessage(jid, {
      text: t("video.providedUrl", { url }),
    });

    try {
      const result = await downloadYouTubeMedia(url, false);
      if (typeof result === "string") {
        // This shouldn't happen for videos, but handle it just in case
        await sendVideo(socket, jid, result);
        return;
      }

      // Send appropriate status update
      if (result.sendAsFile) {
        await socket.sendMessage(jid, {
          text: t("video.downloadCompleteAsFile"),
        });
      } else {
        await socket.sendMessage(jid, {
          text: t("video.downloadComplete"),
        });
      }

      // Send using the appropriate function based on size
      if (result.sendAsFile) {
        await sendVideoFile(socket, jid, result.filePath);
      } else {
        await sendVideo(socket, jid, result.filePath);
      }
    } catch (error) {
      logger.error("Error downloading video:", error);

      // Provide more specific error messages
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        errorMessage.includes("File too large") ||
        errorMessage.includes("max-filesize")
      ) {
        await socket.sendMessage(jid, {
          text: t("video.fileTooLarge"),
        });
      } else if (
        errorMessage.includes("No formats found") ||
        errorMessage.includes("not available")
      ) {
        await socket.sendMessage(jid, {
          text: t("video.unsupportedFormat"),
        });
      } else {
        await socket.sendMessage(jid, {
          text: t("video.downloadError"),
        });
      }
    }
  } catch (error) {
    logger.error("Error handling video command:", error);
    const jid = message.key.remoteJid!;
    await socket.sendMessage(jid, {
      text: t("video.generalError"),
    });
  }
}
