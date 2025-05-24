import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { logger } from "../../config/logger";

export const execAsync = promisify(exec);

// Path for storing downloaded media files
export const DOWNLOADS_PATH = path.join(
  __dirname,
  "../../../../storage/media/downloads"
);

// Create the directory if it doesn't exist
if (!fs.existsSync(DOWNLOADS_PATH)) {
  fs.mkdirSync(DOWNLOADS_PATH, { recursive: true });
}

// Generate a unique file name
export function generateFileName(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

// Get file size in MB
export function getFileSizeMB(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size / (1024 * 1024);
}

// Get video duration using ffprobe
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    logger.warn("Could not get video duration, assuming 0:", error);
    return 0;
  }
}

// Clean up temporary files
export function cleanupFiles(...filePaths: string[]): void {
  for (const filePath of filePaths) {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        logger.warn(`Failed to delete temporary file ${filePath}:`, error);
      }
    }
  }
}
