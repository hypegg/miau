import { readFile } from "fs-extra";
import { tmpdir } from "os";
import { execAsync } from "../../../../utils/media";

const crop = async (filename: string): Promise<Buffer> => {
  const outputName = `${tmpdir()}/${Math.random().toString(36)}.webp`;
  const ffmpegCommand = `ffmpeg -i "${filename}" -vcodec libwebp -vf "crop=w='min(min(iw,ih),500)':h='min(min(iw,ih),500)',scale=500:500,setsar=1,fps=15" -loop 0 -preset default -an -vsync 0 -s 512:512 -y "${outputName}"`;

  await execAsync(ffmpegCommand);
  return await readFile(outputName);
};

export default crop;
