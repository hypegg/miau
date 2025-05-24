import { WAMessage, WASocket } from "baileys";
import { commands } from "../commands";
import { logger } from "../config/logger";
import t from "../i18n";

export interface CommandHandler {
  execute: (
    socket: WASocket,
    message: WAMessage,
    args: string[]
  ) => Promise<void>;
}

/**
 * Parse command and arguments from text
 * Handles commands in various formats like "/command arg1 arg2"
 */
const parseCommand = (text: string): { command: string; args: string[] } => {
  // Remove leading slash and trim any extra whitespace
  const trimmedText = text.startsWith("/") ? text.slice(1).trim() : text.trim();

  // Split by whitespace, handling quoted arguments
  const parts = trimmedText.match(/("[^"]+"|'[^']+'|\S+)/g) || [];

  // Extract command and arguments
  const command = parts[0]?.toLowerCase() || "";

  // Process arguments (remove quotes if present)
  const args = parts.slice(1).map((arg) => {
    if (
      (arg.startsWith('"') && arg.endsWith('"')) ||
      (arg.startsWith("'") && arg.endsWith("'"))
    ) {
      return arg.slice(1, -1);
    }
    return arg;
  });

  return { command, args };
};

/**
 * Handle command execution
 * Routes the command to the appropriate handler based on command name
 */
export const handleCommand = async (
  socket: WASocket,
  message: WAMessage,
  text: string
): Promise<void> => {
  try {
    const { command, args } = parseCommand(text);
    const jid = message.key.remoteJid!;
    const user = message.pushName || jid;

    // Log the command
    logger.command(command, user, { args, jid });

    // Check if the command exists
    if (commands[command]) {
      // Execute the command
      await commands[command].execute(socket, message, args);
    } else {
      // Command not found
      await socket.sendMessage(jid, {
        text: t("help.notFound", { command }),
      });
    }
  } catch (error) {
    const jid = message.key.remoteJid!;
    logger.error("Error handling command:", {
      error: error instanceof Error ? error.message : String(error),
      jid,
    });
    await socket.sendMessage(jid, {
      text: t("core.commandError"),
    });
  }
};

export default handleCommand;
