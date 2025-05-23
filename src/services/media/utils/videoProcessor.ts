import fs from "fs";
import { logger } from "../../../config/logger";
import { execAsync, getFileSizeMB } from "../utils/fileUtils";

// Convert video to mp4 with minimal processing
export async function convertToMp4(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    logger.info(`Converting video from ${inputPath} to ${outputPath}`);

    // Basic conversion to MP4 format with good quality and minimal compression
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2" -y "${outputPath}"`;

    logger.info("Starting video conversion...");
    const { stderr } = await execAsync(ffmpegCommand);

    if (stderr && !stderr.includes("time=")) {
      logger.warn(`FFmpeg warnings: ${stderr}`);
    }

    const finalSizeMB = getFileSizeMB(outputPath);
    logger.info(`Final file size: ${finalSizeMB.toFixed(2)} MB`);
    logger.info("Video conversion completed successfully");

    // Remove the original file after successful conversion
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  } catch (error) {
    logger.error("Error converting video:", error);
    throw new Error(`Failed to convert video: ${error}`);
  }
}
