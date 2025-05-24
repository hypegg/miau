import { WAMessage, WASocket } from "baileys";
import { handleAudioCommand } from "./audio";
import { handleStickerCommand } from "./sticker";
import { handleVideoCommand } from "./video";
import t from "../i18n";

export interface Command {
  name: string;
  description: string;
  usage: string;
  execute: (
    socket: WASocket,
    message: WAMessage,
    args: string[]
  ) => Promise<void>;
}

// Help Command
const help: Command = {
  name: "help",
  description: t("help.description"),
  usage: t("help.usage"),
  execute: async (socket: WASocket, message: WAMessage, args: string[]) => {
    const jid = message.key.remoteJid!;

    // If a specific command was requested
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = commands[commandName];

      if (command) {
        await socket.sendMessage(jid, {
          text: t("help.commandDetails", {
            name: command.name,
            description: command.description,
            usage: command.usage,
          }),
        });
      } else {
        await socket.sendMessage(jid, {
          text: t("help.notFound", { command: commandName }),
        });
      }
      return;
    }

    // General help message
    let helpTextAvailableCommands = t("help.availableCommands") + "\n\n";

    // Get unique commands by filtering out aliases
    const uniqueCommands = Object.values(commands).filter((cmd, index, arr) => {
      // Keep only the first occurrence of each unique execute function
      return arr.findIndex((c) => c.execute === cmd.execute) === index;
    });

    uniqueCommands.forEach((cmd) => {
      helpTextAvailableCommands += `*/${cmd.name}*: ${cmd.description}\n`;
    });

    helpTextAvailableCommands += "\n" + t("help.moreDetails");

    await socket.sendMessage(jid, { text: helpTextAvailableCommands });
  },
};

// Sticker Command
const sticker: Command = {
  name: "sticker",
  description: t("sticker.description"),
  usage: t("sticker.usage"),
  execute: async (socket: WASocket, message: WAMessage, args: string[]) => {
    await handleStickerCommand(socket, message);
  },
};

// Audio Command
const audio: Command = {
  name: "audio",
  description: t("audio.description"),
  usage: t("audio.usage"),
  execute: async (socket: WASocket, message: WAMessage, args: string[]) => {
    await handleAudioCommand(socket, message, args);
  },
};

// Video Command
const video: Command = {
  name: "video",
  description: t("video.description"),
  usage: t("video.usage"),
  execute: async (socket: WASocket, message: WAMessage, args: string[]) => {
    await handleVideoCommand(socket, message, args);
  },
};

// Add all commands to the commands object
export const commands: Record<string, Command> = {
  help,
  sticker,
  s: sticker, // Alias for sticker
  audio,
  video,
};

export default commands;
