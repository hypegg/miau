import { isJidGroup, WAMessage, WASocket } from "baileys";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { logger } from "../../config/logger";
import t from "../../i18n";
import { ENV } from "../../config/environment";
import {
  execAsync,
  generateFileName,
  cleanupFiles,
} from "../../utils/media/fileUtils";
import { extractMediaFromMessage } from "../../utils/message/";

// Metadata for stickers
interface StickerMetadata {
  package: string;
  author: string;
}

// Path for storing temporary files
const TMP_PATH = path.join(__dirname, "../../../storage/media");
const STICKER_PATH = path.join(TMP_PATH, "stickers");

// Create the directories if they don't exist
if (!fs.existsSync(TMP_PATH)) {
  fs.mkdirSync(TMP_PATH, { recursive: true });
}

if (!fs.existsSync(STICKER_PATH)) {
  fs.mkdirSync(STICKER_PATH, { recursive: true });
}

// Process image to WebP sticker
async function processImageToSticker(
  buffer: Buffer,
  metadata: StickerMetadata
): Promise<string> {
  const fileName = generateFileName("sticker", "webp");
  const outputPath = path.join(STICKER_PATH, fileName);

  try {
    await sharp(buffer)
      .resize(512, 512, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 80 })
      // Add metadata separately
      .withMetadata({
        exif: {
          IFD0: {
            ImageDescription: JSON.stringify({
              "sticker-pack-name": metadata.package,
              "sticker-pack-publisher": metadata.author,
            }),
          },
        },
      })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    logger.error("Error converting image to sticker:", error);
    throw error;
  }
}

// Process video to animated WebP sticker
async function processVideoToSticker(
  buffer: Buffer,
  extension: string,
  metadata: StickerMetadata
): Promise<string> {
  const inputFileName = generateFileName("input", extension);
  const inputPath = path.join(TMP_PATH, inputFileName);
  const outputFileName = generateFileName("sticker", "webp");
  const outputPath = path.join(STICKER_PATH, outputFileName);

  try {
    // Save buffer to file for ffmpeg processing
    fs.writeFileSync(inputPath, buffer);

    // Extract frames and convert to animated WebP (limit to 5 seconds)
    await execAsync(
      `ffmpeg -y -i "${inputPath}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -c:v libwebp -lossless 0 -compression_level 6 -q:v 80 -loop 0 -preset default -an -vsync 0 -metadata "sticker-pack-name=${metadata.package}" -metadata "sticker-pack-publisher=${metadata.author}" "${outputPath}"`
    );

    // Cleanup input file
    cleanupFiles(inputPath);
    return outputPath;
  } catch (error) {
    cleanupFiles(inputPath);
    logger.error("Error converting video to animated sticker:", error);
    throw error;
  }
}

// Get user details from message
function getStickerMetadata(message: WAMessage): StickerMetadata {
  const authorName = message.pushName || "unknown";
  return {
    package: ENV.BOT_NAME,
    author: authorName,
  };
}

// Convert media to sticker
export async function createSticker(
  socket: WASocket,
  message: WAMessage
): Promise<void> {
  const jid = message.key.remoteJid!;
  let stickerPath = "";

  try {
    // Extract media from message
    const mediaData = await extractMediaFromMessage(message);

    if (!mediaData) {
      await socket.sendMessage(
        jid,
        {
          text: t("sticker.noMediaFound"),
        },
        { quoted: message }
      );
      return;
    }

    const { buffer, type, extension } = mediaData;
    const metadata = getStickerMetadata(message);

    // Process media based on its type
    if (type === "image") {
      logger.debug("Processing image to sticker");
      stickerPath = await processImageToSticker(buffer, metadata);
    } else if (type === "video") {
      logger.debug("Processing video to sticker");
      stickerPath = await processVideoToSticker(buffer, extension, metadata);
    } else {
      throw new Error(`Unsupported media type: ${type}`);
    }

    // Send the sticker
    await socket.sendMessage(jid, {
      sticker: fs.readFileSync(stickerPath),
      // Add quoted message reference if not in a group
      ...(isJidGroup(jid) ? {} : { quoted: message }),
    });

    logger.info(`Successfully sent sticker to ${jid}`);
  } catch (error) {
    logger.error("Error in sticker creation process:", error);
    // Send error message to user
    await socket.sendMessage(
      jid,
      {
        text: t("sticker.processingError"),
      },
      { quoted: message }
    );
  } finally {
    // Clean up temporary files
    if (stickerPath) {
      cleanupFiles(stickerPath);
    }
  }
}

export default {
  createSticker,
};
// Note: The above code assumes that you have ffmpeg installed and available in your PATH.
