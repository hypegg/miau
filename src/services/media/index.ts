import { downloadYouTubeMedia } from "./handlers/youtubeDownloader";
import { sendAudio, sendVideo, sendVideoFile } from "./handlers/messageSender";
import { getFileSizeMB, generateFileName } from "./utils/fileUtils";

export {
  // Main functionality
  downloadYouTubeMedia,
  sendAudio,
  sendVideo,
  sendVideoFile,

  // Utility functions that might be useful elsewhere
  getFileSizeMB,
  generateFileName,
};

export default {
  downloadYouTubeMedia,
  sendAudio,
  sendVideo,
  sendVideoFile,
};
