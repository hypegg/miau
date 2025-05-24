// Audio command translations for all languages
export const audioTranslations = {
  en: {
    // Command metadata
    name: "audio",
    description: "Downloads a video and sends it as audio",
    usage: "/audio [video URL]",

    // Command messages
    providedUrl: "Downloading audio from {url}...",
    noUrl: "Please provide a video URL. Usage: /audio [video URL]",
    downloadComplete: "Download complete! Sending audio...",
    downloadError:
      "Failed to download audio. Please check the URL and try again.",
    generalError: "An error occurred while processing your command.",
  },
  es: {
    // Command metadata
    name: "audio",
    description: "Descarga un video y lo envía como audio",
    usage: "/audio [URL del video]",

    // Command messages
    providedUrl: "Descargando audio desde {url}...",
    noUrl:
      "Por favor proporciona una URL de video. Uso: /audio [URL del video]",
    downloadComplete: "¡Descarga completa! Enviando audio...",
    downloadError:
      "Error al descargar el audio. Por favor verifica la URL e intenta de nuevo.",
    generalError: "Ocurrió un error al procesar tu comando.",
  },
  pt: {
    // Command metadata
    name: "audio",
    description: "Baixa um vídeo e o envia como áudio",
    usage: "/audio [URL do vídeo]",

    // Command messages
    providedUrl: "Baixando áudio de {url}...",
    noUrl: "Por favor forneça uma URL de vídeo. Uso: /audio [URL do vídeo]",
    downloadComplete: "Download completo! Enviando áudio...",
    downloadError:
      "Falha ao baixar o áudio. Por favor verifique a URL e tente novamente.",
    generalError: "Ocorreu um erro ao processar seu comando.",
  },
} as const;
