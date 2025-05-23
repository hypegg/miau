export const translations = {
  sticker: {
    creating: "Criando sticker...",
    fetchingMentioned: "Buscando mensagem mencionada...",
    noMediaInMention:
      "Para criar um sticker da mídia de alguém, por favor responda diretamente à mensagem.",
    noMedia:
      "Por favor envie uma imagem ou vídeo com o comando /sticker ou /s, ou responda a uma mensagem com mídia usando /sticker ou /s.",
    error: "Falha ao criar o sticker. Por favor tente novamente.",
    noMediaFound: "❌ Nenhuma mídia encontrada na mensagem.",
    processingError:
      "❌ Falha ao criar o sticker. Por favor tente com outra mídia.",
  },
  commands: {
    help: {
      name: "ajuda",
      description: "Mostra os comandos disponíveis e seu uso",
      usage: "/ajuda [comando]",
      availableCommands: "Comandos Disponíveis:",
      moreDetails:
        "Para mais detalhes sobre um comando, digite */ajuda [comando]*",
      notFound:
        "Comando não encontrado: {command}. Digite /ajuda para ver os comandos disponíveis.",
    },
    sticker: {
      name: "sticker",
      description: "Converte mídia em sticker",
      usage: "/sticker ou /s (na legenda de uma imagem ou vídeo)",
    },
    audio: {
      name: "audio",
      description: "Baixa um vídeo e envia como áudio",
      usage: "/audio [URL do vídeo]",
    },
    video: {
      name: "video",
      description: "Baixa e envia um vídeo",
      usage: "/video [URL do vídeo]",
    },
    commandDetails: "*{name}*\n{description}\n*Uso:* {usage}",
  },
  video: {
    providedUrl: "Baixando o vídeo de {url}...",
    noUrl: "Por favor, forneça uma URL de vídeo. Uso: /video [URL do vídeo]",
    downloadComplete: "Download completo! Enviando vídeo...",
    downloadError:
      "Falha ao baixar o vídeo. Por favor, verifique a URL e tente novamente.",
    generalError: "Ocorreu um erro ao processar seu comando.",
  },
  audio: {
    providedUrl: "Baixando o áudio de {url}...",
    noUrl: "Por favor, forneça uma URL de vídeo. Uso: /audio [URL do vídeo]",
    downloadComplete: "Download completo! Enviando áudio...",
    downloadError:
      "Falha ao baixar o áudio. Por favor, verifique a URL e tente novamente.",
    generalError: "Ocorreu um erro ao processar seu comando.",
  },
  media: {
    videoSent: "Aqui está o vídeo que você pediu!",
    videoFileSent:
      "Arquivo de vídeo ({size} MB)\n\nObservação: Este vídeo era muito grande para ser enviado como mensagem de vídeo, por isso está sendo enviado como arquivo. Baixe e assista no seu reprodutor de vídeo preferido.",
  },
  // Add more command translations as needed
};
