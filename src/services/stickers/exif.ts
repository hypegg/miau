import { Image } from "node-webpmux";
import { StickerOptions } from "./stickerBuilder";
import { generateStickerID } from "./utils";

// This constant represents the static header bytes for the EXIF data block.
// It's structured according to the EXIF specification for WebP,
// indicating the start of EXIF data and providing some initial structure.
const EXIF_HEADER_BYTES = Buffer.from([
  0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
]);

export class stickerExif {
  private metadata: any; // Consider defining a more specific type for metadata if possible

  constructor(options: Required<StickerOptions>) {
    // The metadata object stores sticker pack information.
    // "sticker-pack-id": A unique identifier for the sticker pack.
    // "sticker-pack-name": The name of the sticker pack.
    // "sticker-pack-publisher": The author or publisher of the sticker pack.
    // "emojis": An array of emojis associated with the sticker.
    this.metadata = {
      "sticker-pack-id": generateStickerID(),
      "sticker-pack-name": options.pack,
      "sticker-pack-publisher": options.author,
      emojis: options.emojis || [], // Ensure emojis is an array
    };
  }

  async addMetadata(imageBuffer: Buffer): Promise<Buffer> {
    try {
      const imageHandler = new Image();
      await imageHandler.load(imageBuffer);

      // Create EXIF data
      const exifData = JSON.stringify(this.metadata);
      const exifPayload = Buffer.from(exifData, "utf8");

      const exifBuffer = Buffer.concat([EXIF_HEADER_BYTES, exifPayload]);

      // The length of the exifPayload (JSON string) is written at offset 14 in the exifBuffer.
      exifBuffer.writeUIntLE(Buffer.byteLength(exifData, "utf8"), 14, 4);
      imageHandler.exif = exifBuffer;

      // img.save(null) saves the image with modified EXIF data back to a buffer.
      return await imageHandler.save(null);
    } catch (error) {
      // If EXIF processing fails (e.g., invalid image format or library issue),
      // the original image buffer is returned. This ensures that the sticker creation
      // process can still proceed, albeit without the custom EXIF metadata.
      return imageBuffer;
    }
  }
}
