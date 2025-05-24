// Video command translations for all languages
export const videoTranslations = {
  en: {
    // Command metadata
    name: "video",
    description: "Downloads a video and sends it",
    usage: "/video [video URL]",

    // Command messages
    providedUrl: "Downloading video from {url}...",
    noUrl: "Please provide a video URL. Usage: /video [video URL]",
    downloadComplete: "Download complete! Sending video...",
    downloadError:
      "Failed to download video. Please check the URL and try again.",
    generalError: "An error occurred while processing your command.",
    downloadCompleteAsFile:
      "✅ Download complete! The video is large, so I'm sending it as a file. Please wait...",
    fileTooLarge:
      "❌ The video is too large to download (>100MB). Please try a shorter video or different URL.",
    unsupportedFormat:
      "❌ This video format is not supported or the video is not available. Please try a different URL.",

    // Media messages
    videoSent: "Here is your requested video!",
    videoFileSent:
      "Video file ({size} MB)\n\nNote: This video was too large to send as a video message, so it's being sent as a file. Download and play it in your preferred video player.",
  },
  es: {
    // Command metadata
    name: "video",
    description: "Descarga un video y lo envía",
    usage: "/video [URL del video]",

    // Command messages
    providedUrl: "Descargando video desde {url}...",
    noUrl:
      "Por favor proporciona una URL de video. Uso: /video [URL del video]",
    downloadComplete: "¡Descarga completa! Enviando video...",
    downloadError:
      "Error al descargar el video. Por favor verifica la URL e intenta de nuevo.",
    generalError: "Ocurrió un error al procesar tu comando.",
    downloadCompleteAsFile:
      "✅ ¡Descarga completa! El video es grande, así que lo enviaré como archivo. Por favor espera...",
    fileTooLarge:
      "❌ El video es demasiado grande para descargar (>100MB). Por favor intenta con un video más corto o una URL diferente.",
    unsupportedFormat:
      "❌ Este formato de video no es compatible o el video no está disponible. Por favor intenta con una URL diferente.",

    // Media messages
    videoSent: "¡Aquí tienes el video que solicitaste!",
    videoFileSent:
      "Archivo de video ({size} MB)\n\nNota: Este video era demasiado grande para enviarse como un mensaje de video, por lo que se envía como un archivo. Descárgalo y reprodúcelo en tu reproductor de video preferido.",
  },
  pt: {
    // Command metadata
    name: "video",
    description: "Baixa um vídeo e o envia",
    usage: "/video [URL do vídeo]",

    // Command messages
    providedUrl: "Baixando vídeo de {url}...",
    noUrl: "Por favor forneça uma URL de vídeo. Uso: /video [URL do vídeo]",
    downloadComplete: "Download completo! Enviando vídeo...",
    downloadError:
      "Falha ao baixar o vídeo. Por favor verifique a URL e tente novamente.",
    generalError: "Ocorreu um erro ao processar seu comando.",
    downloadCompleteAsFile:
      "✅ Download completo! O vídeo é grande, então vou enviá-lo como arquivo. Por favor aguarde...",
    fileTooLarge:
      "❌ O vídeo é muito grande para baixar (>100MB). Por favor tente um vídeo mais curto ou uma URL diferente.",
    unsupportedFormat:
      "❌ Este formato de vídeo não é suportado ou o vídeo não está disponível. Por favor tente uma URL diferente.",

    // Media messages
    videoSent: "Aqui está o vídeo que você pediu!",
    videoFileSent:
      "Arquivo de vídeo ({size} MB)\n\nNota: Este vídeo era grande demais para ser enviado como uma mensagem de vídeo, então está sendo enviado como um arquivo. Baixe e reproduza-o no seu reprodutor de vídeo preferido.",
  },
} as const;
