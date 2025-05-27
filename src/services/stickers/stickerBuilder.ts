import { writeFile } from "fs/promises";
// import sharp from "sharp"; // sharp was not directly used here, only in Converter
import { logger } from "../../config/logger";
import { Converter } from "./converter";
import { stickerExif } from "./exif";

export interface StickerOptions {
  pack?: string;
  author?: string;
  type?: "default" | "crop" | "full" | "circle" | "rounded";
  quality?: number;
  background?: { r: number; g: number; b: number; alpha: number };
  emojis?: string[];
}

// Default values for StickerOptions
const DEFAULT_PACK_NAME = "";
const DEFAULT_AUTHOR_NAME = "";
const DEFAULT_STICKER_TYPE = "default";
const DEFAULT_QUALITY = 80;
const MIN_QUALITY = 10;
const MAX_QUALITY = 100;
const DEFAULT_BACKGROUND_COLOR = { r: 0, g: 0, b: 0, alpha: 0 };
const DEFAULT_EMOJIS: string[] = [];

export class Sticker {
  private metadata: Required<StickerOptions>;

  constructor(
    private data: Buffer,
    options: StickerOptions = {},
    private mime: string
  ) {
    // The quality value is clamped between MIN_QUALITY (10) and MAX_QUALITY (100)
    // to ensure it stays within a valid and sensible range.
    const quality = Math.min(
      Math.max(options.quality || DEFAULT_QUALITY, MIN_QUALITY),
      MAX_QUALITY
    );

    this.metadata = {
      pack: options.pack || DEFAULT_PACK_NAME,
      author: options.author || DEFAULT_AUTHOR_NAME,
      type: options.type || DEFAULT_STICKER_TYPE,
      quality: quality,
      background: options.background || DEFAULT_BACKGROUND_COLOR,
      emojis: options.emojis || DEFAULT_EMOJIS,
    };
  }

  async build(): Promise<Buffer> {
    try {
      // Detect media type efficiently (already provided as this.mime)
      const mimeType = this.mime;

      // The Converter class is responsible for handling the actual image/video
      // processing, such as resizing, cropping, and converting to WebP format.
      const converter = new Converter(this.metadata);
      const webpBuffer = await converter.convert(this.data, mimeType);

      // The stickerExif class is responsible for embedding metadata (pack name, author, emojis)
      // into the EXIF data of the WebP sticker.
      const exif = new stickerExif(this.metadata);
      return await exif.addMetadata(webpBuffer);
    } catch (error) {
      logger.error("Error building sticker:", error);
      throw error;
    }
  }

  async toFile(filename: string): Promise<void> {
    const buffer = await this.build();
    await writeFile(filename, buffer);
  }
}
