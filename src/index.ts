import { connectionManager } from "./connection";
import { messageHandler } from "./handlers";
import { logger } from "./config/logger";
import { ENV } from "./config";

async function startBot() {
  const { version } = require("../package.json");

  try {
    logger.startup(ENV.BOT_NAME, version || "dev");
    logger.info("Starting WhatsApp bot...");

    // Load environment variables
    logger.debug(`Loaded environment variables:\n${JSON.stringify(ENV)}`);

    // Register the message handler with the connection manager
    // This ensures handlers are attached to any new socket instances
    connectionManager.onMessage(async (socket, message) => {
      await messageHandler(socket, message);
    });

    // Initialize the WhatsApp connection
    const socket = await connectionManager.connect();

    logger.success("Bot started successfully");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT, shutting down gracefully...");
      await connectionManager.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM, shutting down gracefully...");
      await connectionManager.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start bot:", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Start the bot
startBot().catch((error) => {
  logger.error("Unhandled error in startBot:", error);
  process.exit(1);
});
