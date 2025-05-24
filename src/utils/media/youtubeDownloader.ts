import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { logger } from "../../config/logger";
import { DOWNLOADS_PATH, generateFileName, getFileSizeMB } from "./fileUtils";
import { convertToMp4 } from "./videoProcessor";

// Size limits
const VIDEO_MESSAGE_LIMIT_MB = 15; // WhatsApp video message limit
const FILE_UPLOAD_LIMIT_MB = 100; // Our bot's file upload limit

// Download audio with yt-dlp
export async function downloadAudio(url: string): Promise<string> {
  const outputFormat = "opus";
  const prefix = "audio";
  const fileName = generateFileName(prefix, outputFormat);
  const outputPath = path.join(DOWNLOADS_PATH, fileName);

  logger.info(`Downloading audio from ${url} to ${outputPath}`);

  const args = [
    "-x",
    "--audio-format",
    "opus",
    "--audio-quality",
    "0",
    "--postprocessor-args",
    "-ar 48000",
    "-o",
    outputPath,
    url,
  ];

  return new Promise((resolve, reject) => {
    const ytDlp = spawn("yt-dlp", args);
    let errorOutput = "";

    ytDlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytDlp.on("close", (code) => {
      if (code !== 0) {
        logger.error(`yt-dlp exited with code ${code}: ${errorOutput}`);
        reject(new Error(`yt-dlp failed: ${errorOutput}`));
        return;
      }

      logger.info(`Audio download completed: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// Download video with yt-dlp
export async function downloadVideo(
  url: string
): Promise<{ filePath: string; sendAsFile: boolean }> {
  const tempFileName = generateFileName("video_temp", "%(ext)s");
  const tempOutputPath = path.join(DOWNLOADS_PATH, tempFileName);

  const finalFileName = generateFileName("video", "mp4");
  const finalOutputPath = path.join(DOWNLOADS_PATH, finalFileName);

  logger.info(`Downloading video from ${url}`);

  // Download with some basic quality/size control while allowing native format
  const args = [
    "--format-sort",
    "res:720,+size,+br", // Prefer 720p max, smaller size, better bitrate
    "--max-filesize",
    `${FILE_UPLOAD_LIMIT_MB}M`, // Hard limit to prevent downloading extremely large files
    "-o",
    tempOutputPath,
    url,
  ];

  const downloadedPath = await new Promise<string>((resolve, reject) => {
    const ytDlp = spawn("yt-dlp", args);
    let errorOutput = "";

    ytDlp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    ytDlp.on("close", (code) => {
      if (code !== 0) {
        logger.error(`yt-dlp exited with code ${code}`);
        logger.error(`Error output: ${errorOutput}`);
        reject(new Error(`yt-dlp failed: ${errorOutput}`));
        return;
      }

      // Find the actual downloaded file
      const basePattern = tempOutputPath.replace("%(ext)s", "");
      const baseName = path.basename(basePattern);

      try {
        const files = fs
          .readdirSync(DOWNLOADS_PATH)
          .filter((file) => file.startsWith(baseName));

        if (files.length === 0) {
          reject(new Error("Downloaded file not found"));
          return;
        }

        const actualPath = path.join(DOWNLOADS_PATH, files[0]);
        const fileSizeMB = getFileSizeMB(actualPath);
        logger.info(
          `Video download completed: ${actualPath} (${fileSizeMB.toFixed(
            2
          )} MB)`
        );
        resolve(actualPath);
      } catch (fsError) {
        reject(new Error(`Error finding downloaded file: ${fsError}`));
      }
    });
  });

  const originalSizeMB = getFileSizeMB(downloadedPath);
  const fileExtension = path.extname(downloadedPath).toLowerCase();

  // Decide whether to send as video message or file
  const sendAsFile = originalSizeMB > VIDEO_MESSAGE_LIMIT_MB;

  // Log the decision
  if (sendAsFile) {
    logger.info(
      `File size (${originalSizeMB.toFixed(
        2
      )} MB) exceeds video message limit. Will send as file.`
    );
  } else {
    logger.info(
      `File size (${originalSizeMB.toFixed(
        2
      )} MB) is suitable for video message.`
    );
  }

  // Handle conversion based on file type and size
  if (fileExtension === ".mp4") {
    // If it's already MP4, just rename it
    fs.renameSync(downloadedPath, finalOutputPath);
    logger.info(`MP4 file ready for sending: ${finalOutputPath}`);
    return { filePath: finalOutputPath, sendAsFile };
  } else {
    // If it's not MP4, convert it (keeping original quality)
    logger.info(`Converting ${fileExtension} to MP4`);
    await convertToMp4(downloadedPath, finalOutputPath);
    return { filePath: finalOutputPath, sendAsFile };
  }
}

// Main download function that handles both audio and video
export async function downloadYouTubeMedia(
  url: string,
  isAudio = false
): Promise<string | { filePath: string; sendAsFile: boolean }> {
  try {
    if (isAudio) {
      return await downloadAudio(url);
    } else {
      return await downloadVideo(url);
    }
  } catch (error) {
    logger.error("Error downloading media:", error);
    throw error;
  }
}
