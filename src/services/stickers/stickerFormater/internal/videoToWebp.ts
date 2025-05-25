import { writeFile, readFile, unlink } from "fs-extra";
import { tmpdir } from "os";
import { execAsync } from "../../../../utils/media";

const videoToWebP = async (data: Buffer): Promise<Buffer> => {
  const filename = `${tmpdir()}/${Math.random().toString(36)}`;
  const [video, webp] = ["video", "webp"].map((ext) => `${filename}.${ext}`);
  await writeFile(video, data);

  const ffmpegCommand = `ffmpeg -y -i "${video}" -t 5 -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15" -c:v libwebp -lossless 0 -compression_level 4 -q:v 75 -loop 0 -preset default -method 4 -an "${webp}"`;

  await execAsync(ffmpegCommand);

  const buffer = await readFile(webp);
  [video, webp].forEach((file) => unlink(file));
  return buffer;
};

export default videoToWebP;
