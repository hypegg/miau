import { WAMessage, WASocket } from "baileys";
import fs from "fs/promises";
import path from "path";
import { ENV } from "../../config";
import { logger } from "../../config/logger";
import t from "../../i18n";
import { cleanupFiles, generateFileName } from "../../utils/media/fileUtils";
import { sendQuoteSticker, sendQuoteText } from "../../utils/message";
import {
  extractMediaFromMessage,
  MediaData,
} from "../../utils/message/messageUtils"; // Assuming MediaData type from extractMediaFromMessage
import { Sticker, StickerOptions } from "./stickerBuilder";
import { validateEmojis } from "./utils";
import { log } from "console";

const STICKER_PATH = path.join(__dirname, "../../../storage/media/stickers");
const VALID_STICKER_TYPES = [
  "crop",
  "full",
  "circle",
  "rounded",
  "default",
] as const;
type StickerType = (typeof VALID_STICKER_TYPES)[number];

// Global Constants
const MEDIA_EXTRACTION_TIMEOUT_MS = 30000;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const FILE_CLEANUP_DELAY_MS = 5000;
const DEFAULT_STICKER_TYPE: StickerType = "default";

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  try {
    await fs.mkdir(STICKER_PATH, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
}
ensureDirectories();

/**
 * Parses command arguments for sticker creation, supporting --pack, --author,
 * --emojis, and sticker type flags (e.g., -crop).
 * This function iterates through the arguments, identifying known flags
 * and their corresponding values. It also validates emoji inputs.
 * @param {string[]} args - Array of command arguments.
 * @returns {Partial<StickerOptions> & { type: StickerType; error?: string }}
 * Parsed options, including type, and an optional error message.
 */
function parseStickerArgs(
  args: string[]
): Partial<StickerOptions> & { type: StickerType; error?: string } {
  const options: Partial<StickerOptions> = {};
  let type: StickerType = DEFAULT_STICKER_TYPE;
  let error: string | undefined = undefined;
  let i = 0;

  // The loop iterates and increments `i` inside based on argument consumption.
  // This approach is kept to maintain original logic as per instructions.
  while (i < args.length) {
    const arg = args[i].toLowerCase();
    const nextArg = i + 1 < args.length ? args[i + 1] : null;

    if (arg === "--pack" && nextArg && !nextArg.startsWith("-")) {
      options.pack = args[i + 1];
      i += 2;
    } else if (arg === "--author" && nextArg && !nextArg.startsWith("-")) {
      options.author = args[i + 1];
      i += 2;
    } else if (arg === "--emojis" && nextArg && !nextArg.startsWith("-")) {
      const validated = validateEmojis(args[i + 1]);
      if (validated) {
        options.emojis = validated;
      } else {
        error = t("sticker.invalidEmojis"); // Set error if emojis are invalid
      }
      i += 2;
    } else if (arg.startsWith("-") && !arg.startsWith("--")) {
      const potentialType = arg.slice(1);
      const isValidType = (value: string): value is StickerType =>
        VALID_STICKER_TYPES.includes(value as StickerType);
      if (isValidType(potentialType)) {
        type = potentialType;
      } else {
        logger.warn(`Invalid sticker type flag used: ${arg}`);
      }
      i++;
    } else {
      logger.warn(`Unknown or misplaced argument: ${arg}`);
      i++;
    }
  }

  options.type = type; // Always set the type (or default)
  return { ...options, type, error };
}

async function extractAndValidateMedia(
  targetMessage: WAMessage,
  socket: WASocket,
  chatId: string,
  commandMessage: WAMessage
): Promise<MediaData | null> {
  // Promise.race is used here to implement a timeout for media extraction.
  // If extractMediaFromMessage takes longer than MEDIA_EXTRACTION_TIMEOUT_MS,
  // the timeout promise will reject, preventing indefinite waiting.
  logger.debug("Extracting media from message...");
  const mediaData = await Promise.race([
    extractMediaFromMessage(targetMessage),
    new Promise<null>((_, reject) =>
      setTimeout(
        () => reject(new Error(t("sticker.mediaExtractionTimeout"))),
        MEDIA_EXTRACTION_TIMEOUT_MS
      )
    ),
  ]);

  if (!mediaData) {
    await sendQuoteText(socket, chatId, t("sticker.noMedia"), commandMessage);
    return null;
  }

  logger.debug(
    `Received media for sticker: ${mediaData.mime}, size: ${mediaData.buffer.length} bytes`
  );

  if (mediaData.buffer.length > MAX_FILE_SIZE_BYTES) {
    await sendQuoteText(
      socket,
      chatId,
      t("sticker.fileTooLarge"),
      commandMessage
    );
    return null;
  }
  return mediaData;
}

function buildStickerOptions(
  parsedArgs: Partial<StickerOptions> & { type: StickerType },
  targetMessage: WAMessage
): StickerOptions {
  return {
    pack: parsedArgs.pack || ENV.BOT_NAME || "Miau Bot",
    author: parsedArgs.author || targetMessage.pushName || "User",
    type: parsedArgs.type || DEFAULT_STICKER_TYPE,
    quality: ENV.STICKER_QUALITY || 80,
    emojis: parsedArgs.emojis || [],
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };
}

async function processAndSendSticker(
  socket: WASocket,
  chatId: string,
  commandMessage: WAMessage,
  stickerOptions: StickerOptions,
  mediaBuffer: Buffer,
  mediaMime: string
): Promise<string | null> {
  // Returns sticker file path or null on failure
  const startTime = Date.now();
  logger.debug("Starting sticker creation...");
  const stickerInstance = new Sticker(mediaBuffer, stickerOptions, mediaMime);
  const stickerOutputFileName = generateFileName("sticker", "webp");
  const outputStickerPath = path.join(STICKER_PATH, stickerOutputFileName);

  await stickerInstance.toFile(outputStickerPath);
  const processingTime = Date.now() - startTime;
  logger.debug(
    `Sticker created in ${processingTime}ms at: ${outputStickerPath}`
  );

  await sendQuoteSticker(socket, chatId, outputStickerPath, commandMessage);
  return outputStickerPath;
}

/**
 * Main function to create a sticker from a message.
 * Handles media extraction, argument parsing, sticker building, and sending.
 * @param {WASocket} socket - Baileys socket instance.
 * @param {WAMessage} mediaSourceMessage - The message containing media.
 * @param {WAMessage} commandMessage - The original command message for quoting.
 * @param {string[]} args - Command arguments.
 */
export async function createSticker(
  socket: WASocket,
  mediaSourceMessage: WAMessage,
  commandMessage: WAMessage,
  args: string[]
): Promise<void> {
  const chatId = mediaSourceMessage.key.remoteJid!;
  let tempFiles: string[] = [];

  try {
    // 1. Extract Media and Validate
    const extractedMedia = await extractAndValidateMedia(
      mediaSourceMessage,
      socket,
      chatId,
      commandMessage
    );
    if (!extractedMedia) {
      return;
    }
    const { buffer: mediaBuffer, mime: mediaMime } = extractedMedia;

    // 2. Parse Arguments & Check for Errors
    const parsedArgs = parseStickerArgs(args);
    if (parsedArgs.error) {
      await sendQuoteText(socket, chatId, parsedArgs.error, commandMessage);
      return;
    }

    // 3. Build Sticker Options
    const stickerOptions = buildStickerOptions(parsedArgs, mediaSourceMessage);
    logger.debug("Sticker options:", stickerOptions);

    // 4. Create Sticker and Send
    const createdStickerPath = await processAndSendSticker(
      socket,
      chatId,
      commandMessage,
      stickerOptions,
      mediaBuffer,
      mediaMime
    );

    if (createdStickerPath) {
      tempFiles.push(createdStickerPath);
    }
  } catch (error) {
    logger.error(`Error creating sticker: ${error}`);
    const errorMessage =
      error instanceof Error &&
      error.message === t("sticker.mediaExtractionTimeout")
        ? error.message
        : t("sticker.error");
    await sendQuoteText(socket, chatId, errorMessage, commandMessage);
  } finally {
    // Cleanup temp files after a short delay.
    // This delay can be useful to ensure the file is no longer in use
    // by any asynchronous operations before attempting deletion.
    if (tempFiles.length > 0) {
      setTimeout(() => cleanupFiles(...tempFiles), FILE_CLEANUP_DELAY_MS);
    }
  }
}
