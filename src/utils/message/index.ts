import { sendAudio, sendVideo, sendVideoFile } from "../message/messageSender";
import {
  sendQuoteText,
  sendQuoteImage,
  sendQuoteAudio,
  sendQuoteVideo,
  sendQuoteDocument,
  sendQuoteVideoFile,
  sendQuoteSticker,
} from "../message/quoteSender";
import { extractMediaFromMessage } from "./messageUtils";

export {
  sendAudio,
  sendVideo,
  sendVideoFile,
  extractMediaFromMessage,

  // Quote sender functions
  sendQuoteText,
  sendQuoteImage,
  sendQuoteAudio,
  sendQuoteVideo,
  sendQuoteDocument,
  sendQuoteVideoFile,
  sendQuoteSticker,
  // Other exports can be added here as needed
};
