export const translations = {
  sticker: {
    creating: "Creating sticker...",
    fetchingMentioned: "Fetching mentioned message...",
    noMediaInMention:
      "To create a sticker from someone's media, please reply to their message directly.",
    noMedia:
      "Please send an image or video with the caption /sticker or /s, or reply to a media message with /sticker or /s.",
    error: "Failed to create sticker. Please try again.",
    noMediaFound: "❌ No media found in the message.",
    processingError:
      "❌ Failed to create sticker. Please try again with a different media.",
  },
  commands: {
    help: {
      name: "help",
      description: "Shows available commands and their usage",
      usage: "/help [command]",
      availableCommands: "Available Commands:",
      moreDetails: "For more details about a command, type */help [command]*",
      notFound:
        "Command not found: {command}. Type /help for available commands.",
    },
    sticker: {
      name: "sticker",
      description: "Converts media to a sticker",
      usage: "/sticker or /s (caption on an image or video)",
    },
    audio: {
      name: "audio",
      description: "Downloads a video and sends it as audio",
      usage: "/audio [video URL]",
    },
    video: {
      name: "video",
      description: "Downloads a video and sends it",
      usage: "/video [video URL]",
    },
    commandDetails: "*{name}*\n{description}\n*Usage:* {usage}",
  },
  video: {
    providedUrl: "Downloading video from {url}...",
    noUrl: "Please provide a video URL. Usage: /video [video URL]",
    downloadComplete: "Download complete! Sending video...",
    downloadError:
      "Failed to download video. Please check the URL and try again.",
    generalError: "An error occurred while processing your command.",
  },
  audio: {
    providedUrl: "Downloading audio from {url}...",
    noUrl: "Please provide a video URL. Usage: /audio [video URL]",
    downloadComplete: "Download complete! Sending audio...",
    downloadError:
      "Failed to download audio. Please check the URL and try again.",
    generalError: "An error occurred while processing your command.",
  },
  media: {
    videoSent: "Here is your requested video!",
    videoFileSent:
      "Video file ({size} MB)\n\nNote: This video was too large to send as a video message, so it's being sent as a file. Download and play it in your preferred video player.",
  },
  // Add more command translations as needed
};
