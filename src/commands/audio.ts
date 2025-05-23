import { WAMessage, WASocket } from "baileys";
import { logger } from "../config/logger";
import t from "../i18n";
import { downloadYouTubeMedia, sendAudio } from "../services/media";

export async function handleAudioCommand(
  socket: WASocket,
  message: WAMessage,
  args: string[]
): Promise<void> {
  try {
    const jid = message.key.remoteJid!;

    if (args.length === 0) {
      await socket.sendMessage(jid, {
        text: t("audio.noUrl"),
      });
      return;
    }

    const url = args[0];

    await socket.sendMessage(jid, {
      text: t("audio.providedUrl", { url }),
    });
    try {
      // Download audio from the URL
      const result = await downloadYouTubeMedia(url, true);

      // Send a status update
      await socket.sendMessage(jid, {
        text: t("audio.downloadComplete"),
      });

      // Send the audio file
      // For audio, we should always get a string path, but handle object case just in case
      const audioPath = typeof result === "string" ? result : result.filePath;
      await sendAudio(socket, jid, audioPath);
    } catch (error) {
      logger.error("Error downloading audio:", error);
      await socket.sendMessage(jid, {
        text: t("audio.downloadError"),
      });
    }
  } catch (error) {
    logger.error("Error handling audio command:", error);
    const jid = message.key.remoteJid!;
    await socket.sendMessage(jid, {
      text: t("audio.generalError"),
    });
  }
}
