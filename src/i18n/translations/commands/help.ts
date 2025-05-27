// Help command translations for all languages
export const helpTranslations = {
  en: {
    // Command metadata
    name: "help",
    description: "Shows available commands and their usage",
    usage: "/help [command]",

    // Help command specific messages
    availableCommands: "*Available Commands:*",
    moreDetails: "For more details about a command, type */help [command]*",
    notFound:
      "Command not found: {command}. Type /help for available commands.",
    commandDetails:
      "*Command details: `{name}`*\n{description}\n\n*Usage:*\n{usage}",
  },
  es: {
    // Command metadata
    name: "help",
    description: "Muestra los comandos disponibles y su uso",
    usage: "/help [comando]",

    // Help command specific messages
    availableCommands: "*Comandos Disponibles:*",
    moreDetails:
      "Para más detalles sobre un comando, escribe */help [comando]*",
    notFound:
      "Comando no encontrado: {command}. Escribe /help para ver los comandos disponibles.",
    commandDetails:
      "*Detalles del comando: `{name}`*\n{description}\n\n*Uso:*\n{usage}",
  },
  pt: {
    // Command metadata
    name: "help",
    description: "Mostra os comandos disponíveis e seu uso",
    usage: "/help [comando]",

    // Help command specific messages
    availableCommands: "*Comandos Disponíveis:*",
    moreDetails:
      "Para mais detalhes sobre um comando, digite */help [comando]*",
    notFound:
      "Comando não encontrado: {command}. Digite /help para ver os comandos disponíveis.",
    commandDetails:
      "*Detalhes do comando: `{name}`*\n{description}\n\n*Uso:*\n{usage}",
  },
} as const;
