// Sticker command translations for all languages
export const stickerTranslations = {
  en: {
    // Command metadata
    name: "sticker",
    description: "Converts media to a sticker",
    usage: "/sticker or /s (caption on an image or video)",

    // Command messages
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
    fileTooLarge: "❌ File too large. Please send a smaller image or video.",
    mediaExtractionTimeout: "❌ Media extraction timed out. Please try again.",
    invalidEmojis:
      "❌ Invalid emojis provided. Please use 1-3 emojis only, separated by commas or spaces.",
    success: "*Sticker successfully created and sent.*\n",
    pack: "*Sticker pack:* {pack}",
    author: "*Sticker author:* {author}",
    emojis: "*Emojis:* {emojis}",
  },
  es: {
    // Command metadata
    name: "sticker",
    description: "Convierte medios a un sticker",
    usage: "/sticker o /s (como caption en una imagen o video)",

    // Command messages
    creating: "Creando sticker...",
    fetchingMentioned: "Obteniendo mensaje mencionado...",
    noMediaInMention:
      "Para crear un sticker del media de alguien, por favor responde directamente a su mensaje.",
    noMedia:
      "Por favor envía una imagen o video con el caption /sticker o /s, o responde a un mensaje con media usando /sticker o /s.",
    error: "Error al crear el sticker. Por favor intenta de nuevo.",
    noMediaFound: "❌ No se encontró media en el mensaje.",
    processingError:
      "❌ Error al crear el sticker. Por favor intenta de nuevo con un media diferente.",
    fileTooLarge:
      "❌ Archivo demasiado grande. Por favor envía una imagen o video más pequeño.",
    mediaExtractionTimeout:
      "❌ Tiempo de extracción de medios agotado. Por favor intenta de nuevo.",
    invalidEmojis:
      "❌ Emojis inválidos proporcionados. Por favor usa solo 1-3 emojis, separados por comas o espacios.",
  },
  pt: {
    // Command metadata
    name: "sticker",
    description: "Converte mídia em um sticker",
    usage: "/sticker ou /s (como legenda em uma imagem ou vídeo)",

    // Command messages
    creating: "Criando sticker...",
    fetchingMentioned: "Buscando mensagem mencionada...",
    noMediaInMention:
      "Para criar um sticker da mídia de alguém, por favor responda diretamente à mensagem.",
    noMedia:
      "Por favor envie uma imagem ou vídeo com a legenda /sticker ou /s, ou responda a uma mensagem com mídia usando /sticker ou /s.",
    error: "Falha ao criar sticker. Por favor tente novamente.",
    noMediaFound: "❌ Nenhuma mídia encontrada na mensagem.",
    processingError:
      "❌ Falha ao criar sticker. Por favor tente novamente com uma mídia diferente.",
    fileTooLarge:
      "❌ Arquivo muito grande. Por favor envie uma imagem ou vídeo menor.",
    mediaExtractionTimeout:
      "❌ Tempo de extração de mídia esgotado. Por favor, tente novamente.",
    invalidEmojis:
      "❌ Emojis inválidos fornecidos. Por favor, use apenas 1-3 emojis, separados por vírgulas ou espaços.",
  },
} as const;
