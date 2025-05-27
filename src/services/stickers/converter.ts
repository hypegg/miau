import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp, { Sharp } from "sharp";
import { execAsync } from "../../utils/media/fileUtils";
import { StickerOptions } from "./stickerBuilder";

const STICKER_PATH = path.join(__dirname, "../../../storage/media/stickers");

// Global Constants
const STICKER_DIMENSION = 512;
const VIDEO_DURATION_LIMIT = 5; // seconds
const VIDEO_FPS = 15;
const FFMPEG_COMPRESSION_LEVEL = 6; // 0=fast, 6=slow
const FFMPEG_QUALITY = 80; // 0-100, higher is better
const FFMPEG_METHOD = 6; // Better compression method
const SHARP_EFFORT_LEVEL = 4; // Balanced effort level
const TRANSPARENT_BACKGROUND_COLOR = "0x00000000";
const TEMP_VIDEO_PREFIX = "temp_video_";
const TEMP_STICKER_PREFIX = "temp_sticker_";

export class Converter {
  constructor(private options: Required<StickerOptions>) {}

  async convert(data: Buffer, mimeType: string): Promise<Buffer> {
    const isVideo = mimeType.startsWith("video");
    const isAnimated =
      isVideo || mimeType.includes("gif") || mimeType.includes("webp");

    let processedBuffer = data;

    // Handle video conversion with FFmpeg
    if (isVideo) {
      processedBuffer = await this.convertVideo(data);
    }

    // Process image with Sharp (much faster than FFmpeg for images)
    return await this.processImage(processedBuffer, isAnimated);
  }

  private buildFFmpegCommand(
    tempInputPath: string,
    tempOutputPath: string
  ): string {
    // This command scales the video to fit within 512x512, pads it to 512x512 with transparency,
    // sets the FPS, converts to WebP with specific quality and compression settings,
    // and ensures it loops.
    return [
      "ffmpeg -y",
      `-i "${tempInputPath}"`,
      `-t ${VIDEO_DURATION_LIMIT}`, // Limit to 5 seconds for processing
      `-vf "scale=${STICKER_DIMENSION}:${STICKER_DIMENSION}:force_original_aspect_ratio=decrease,format=rgba,pad=${STICKER_DIMENSION}:${STICKER_DIMENSION}:(ow-iw)/2:(oh-ih)/2:color=${TRANSPARENT_BACKGROUND_COLOR},fps=${VIDEO_FPS}[v]"`,
      "-c:v libwebp",
      "-lossless 0",
      `-compression_level ${FFMPEG_COMPRESSION_LEVEL}`,
      `-q:v ${FFMPEG_QUALITY}`,
      `-method ${FFMPEG_METHOD}`,
      "-loop 0",
      "-preset default",
      "-vsync 0",
      "-threads 0", // Use all available cores
      "-an", // No audio
      `"${tempOutputPath}"`,
    ].join(" ");
  }

  private async convertVideo(data: Buffer): Promise<Buffer> {
    const timestamp = Date.now();
    const tempVideoInputPath = `${STICKER_PATH}/${TEMP_VIDEO_PREFIX}${timestamp}.mp4`;
    const tempWebPOutputPath = `${STICKER_PATH}/${TEMP_STICKER_PREFIX}${timestamp}.webp`;

    try {
      await writeFile(tempVideoInputPath, data);

      const ffmpegCommand = this.buildFFmpegCommand(
        tempVideoInputPath,
        tempWebPOutputPath
      );

      await execAsync(ffmpegCommand);
      return await readFile(tempWebPOutputPath);
    } finally {
      // Cleanup
      await Promise.allSettled([
        unlink(tempVideoInputPath),
        unlink(tempWebPOutputPath),
      ]);
    }
  }

  private generateCircleSvg(): Buffer {
    return Buffer.from(
      `<svg width="${STICKER_DIMENSION}" height="${STICKER_DIMENSION}"><circle cx="${
        STICKER_DIMENSION / 2
      }" cy="${STICKER_DIMENSION / 2}" r="${
        STICKER_DIMENSION / 2
      }" fill="white"/></svg>`
    );
  }

  private generateRoundedRectSvg(): Buffer {
    return Buffer.from(
      `<svg width="${STICKER_DIMENSION}" height="${STICKER_DIMENSION}"><rect rx="50" ry="50" width="${STICKER_DIMENSION}" height="${STICKER_DIMENSION}" fill="white"/></svg>`
    );
  }

  private async processImage(
    data: Buffer,
    isAnimated: boolean
  ): Promise<Buffer> {
    let imageProcessor: Sharp = sharp(data, { animated: isAnimated });

    // Apply transformations based on type
    switch (this.options.type) {
      case "crop":
        imageProcessor = imageProcessor.resize(
          STICKER_DIMENSION,
          STICKER_DIMENSION,
          { fit: "cover" }
        );
        break;

      case "full":
        imageProcessor = imageProcessor.resize(
          STICKER_DIMENSION,
          STICKER_DIMENSION,
          {
            fit: "contain",
            background: this.options.background,
          }
        );
        break;

      case "circle":
        imageProcessor = imageProcessor
          .resize(STICKER_DIMENSION, STICKER_DIMENSION, { fit: "cover" })
          .composite([
            {
              input: this.generateCircleSvg(),
              blend: "dest-in",
            },
          ]);
        break;

      case "rounded":
        imageProcessor = imageProcessor
          .resize(STICKER_DIMENSION, STICKER_DIMENSION, { fit: "cover" })
          .composite([
            {
              input: this.generateRoundedRectSvg(),
              blend: "dest-in",
            },
          ]);
        break;

      default:
        // Default: smart resize maintaining aspect ratio
        imageProcessor = imageProcessor.resize(
          STICKER_DIMENSION,
          STICKER_DIMENSION,
          {
            fit: "inside",
            withoutEnlargement: true,
          }
        );
    }

    // Optimized WebP output settings
    return await imageProcessor
      .webp({
        quality: this.options.quality,
        effort: SHARP_EFFORT_LEVEL,
        lossless: false,
        nearLossless: false,
        smartSubsample: true, // Better compression
      })
      .toBuffer();
  }
}
