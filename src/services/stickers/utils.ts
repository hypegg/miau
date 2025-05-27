import { Image } from "node-webpmux"; // Importing the Image class to handle WebP image operations
import { StickerOptions } from "./stickerBuilder"; // Importing StickerOptions type for metadata typing
import { randomBytes } from "crypto"; // Importing randomBytes for secure random ID generation
import { logger } from "../../config"; // Importing logger for debugging

/**
 * Regular expression to match a wide range of Unicode emoji characters.
 * This regex covers:
 * - Copyright (©) and Registered (®) symbols.
 * - General Punctuation, Dingbats, Letterlike Symbols, Arrows, Mathematical Operators,
 * Miscellaneous Technical, Control Pictures, OCR, Enclosed Alphanumerics, Box Drawing,
 * Block Elements, Geometric Shapes, Miscellaneous Symbols, CJK Symbols and Punctuation,
 * Hiragana, Katakana, Bopomofo, Hangul Compatibility Jamo, Kanbun, Bopomofo Extended,
 * CJK Strokes, Katakana Phonetic Extensions, Enclosed CJK Letters and Months,
 * CJK Compatibility, CJK Unified Ideographs Extension A, Yijing Hexagram Symbols,
 * CJK Unified Ideographs, Yi Syllables, Yi Radicals.
 * - Surrogate pairs for emojis in the Supplementary Multilingual Plane (SMP),
 * including Pictographs, Transport and Map Symbols, Miscellaneous Symbols and Pictographs,
 * Emoticons, and regional indicator symbols.
 * Specifically:
 * \u00a9|\u00ae: Matches © and ®.
 * [\u2000-\u3300]: Matches a broad range of symbols and punctuation.
 * \ud83c[\ud000-\udfff]: Matches the first part of a surrogate pair for SMP characters (e.g., flags, many symbols).
 * \ud83d[\ud000-\udfff]: Matches the first part of a surrogate pair for SMP characters (e.g., emoticons, pictographs).
 * \ud83e[\ud000-\udfff]: Matches the first part of a surrogate pair for SMP characters (e.g., newer emojis like face with monocle).
 */
const EMOJI_REGEX =
  /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

/**
 * Generates a unique sticker ID using cryptographic random bytes.
 * @returns {string} A 32-character hexadecimal string representing the sticker ID.
 */
export const generateStickerID = (): string => {
  return randomBytes(16).toString("hex");
};

/**
 * Extracts all emoji characters from a given text using EMOJI_REGEX.
 * @param {string} text - The input text from which to extract emojis.
 * @returns {string[]} An array of extracted emoji strings.
 */
export const extractEmojisFromText = (text: string): string[] => {
  return text.match(EMOJI_REGEX) || [];
};

/**
 * Validates if a string contains only 1 to 3 emojis and no other characters
 * except for spaces and commas, which are ignored.
 * @param {string} text - The input text to validate (e.g., "総" or "櫨,脹").
 * @returns {string[] | null} An array of 1-3 emojis if valid, otherwise null.
 */
export const validateEmojis = (text: string): string[] | null => {
  const emojis = extractEmojisFromText(text);

  // `strippedText` is created by removing all matched emojis and allowed separators (commas, spaces)
  // from the input text. If `strippedText` has any length, it means there were
  // other characters present that are not emojis or allowed separators, making the input invalid.
  const strippedText = text.replace(EMOJI_REGEX, "").replace(/[, ]/g, "");

  if (strippedText.length > 0) {
    logger.debug(
      `Emoji validation failed: Text contains non-emoji characters: '${strippedText}'`
    );
    return null; // Contains non-emoji characters (besides separators)
  }

  if (emojis.length > 0 && emojis.length <= 3) {
    return emojis; // Valid: 1 to 3 emojis found
  }

  logger.debug(
    `Emoji validation failed: Found ${emojis.length} emojis (must be 1-3).`
  );
  return null; // Invalid number of emojis (0 or >3)
};

/**
 * Extracts metadata embedded in a WebP image's EXIF segment.
 * This is typically used for retrieving sticker-related metadata.
 * @param {Buffer} image - The WebP image buffer to extract metadata from.
 * @returns {Promise<Partial<StickerOptions>>} A partial StickerOptions object parsed from EXIF metadata.
 */
export const extractMetadata = async (
  image: Buffer
): Promise<Partial<StickerOptions>> => {
  const imageHandler = new Image();
  await imageHandler.load(image);

  // Extract EXIF data as a UTF-8 string; fallback to empty JSON object string
  const exif = imageHandler.exif?.toString("utf-8") ?? "{}";

  // Parse JSON from EXIF data.
  // The substring method is used here to isolate the JSON object within the EXIF string.
  // This is a safeguard because the EXIF data might contain non-JSON prefixes or suffixes
  // (e.g., padding or other binary data inadvertently converted to string).
  // It looks for the first '{' and the last '}' to define the JSON string boundaries.
  // If parsing fails or if the substring results in an invalid/empty string for JSON.parse,
  // it defaults to an empty object.
  try {
    const jsonString =
      exif.substring(exif.indexOf("{"), exif.lastIndexOf("}") + 1) || "{}";
    return JSON.parse(jsonString) as StickerOptions;
  } catch (error) {
    logger.error("Failed to parse sticker EXIF metadata:", error);
    return {}; // Return empty object on parsing failure
  }
};

// StickerOptions is already exported from stickerBuilder.ts and re-exported by index.ts if needed.
// No need to re-export it here.
