export const translations = {
  sticker: {
    creating: "Creando sticker...",
    fetchingMentioned: "Buscando mensaje mencionado...",
    noMediaInMention:
      "Para crear un sticker del contenido de alguien, por favor responde directamente a su mensaje.",
    noMedia:
      "Por favor envía una imagen o video con el comando /sticker o /s, o responde a un mensaje con contenido usando /sticker o /s.",
    error: "No se pudo crear el sticker. Por favor intenta de nuevo.",
    noMediaFound: "❌ No se encontró contenido en el mensaje.",
    processingError:
      "❌ No se pudo crear el sticker. Por favor intenta con otro contenido.",
  },
  commands: {
    help: {
      name: "ayuda",
      description: "Muestra los comandos disponibles y su uso",
      usage: "/ayuda [comando]",
      availableCommands: "Comandos Disponibles:",
      moreDetails:
        "Para más detalles sobre un comando, escribe */ayuda [comando]*",
      notFound:
        "Comando no encontrado: {command}. Escribe /ayuda para ver los comandos disponibles.",
    },
    sticker: {
      name: "sticker",
      description: "Convierte medios en sticker",
      usage: "/sticker o /s (en el pie de una imagen o video)",
    },
    audio: {
      name: "audio",
      description: "Descarga un video y lo envía como audio",
      usage: "/audio [URL del video]",
    },
    video: {
      name: "video",
      description: "Descarga y envía un video",
      usage: "/video [URL del video]",
    },
    commandDetails: "*{name}*\n{description}\n*Uso:* {usage}",
  },
  video: {
    providedUrl: "Descargando vídeo de {url}...",
    noUrl: "Proporcione una URL de vídeo. Uso: /video [URL del vídeo]",
    downloadComplete: "¡Descarga completada! Enviando vídeo...",
    downloadError:
      "No se ha podido descargar el vídeo. Compruebe la URL e inténtelo de nuevo.",
    generalError: "Se ha producido un error al procesar su comando.",
  },
  audio: {
    providedUrl: "Descargando audio de {url}...",
    noUrl:
      "Por favor, proporcione una URL de vídeo. Uso: /audio [URL del vídeo]",
    downloadComplete: "¡Descarga completada! Enviando audio...",
    downloadError:
      "No se ha podido descargar el audio. Compruebe la URL e inténtelo de nuevo.",
    generalError: "Se ha producido un error al procesar su comando.",
  },
  media: {
    videoSent: "¡Aquí está tu video solicitado!",
    videoFileSent:
      "Archivo de video ({size} MB)\n\nNota: Este video era demasiado grande para enviarse como mensaje de video, así que se envía como archivo. Descárgalo y reprodúcelo en tu reproductor de video preferido.",
  },
  // Add more command translations as needed
};
