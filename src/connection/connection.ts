import makeWASocket, { useMultiFileAuthState, WASocket } from "baileys";
import { join } from "path";
import P from "pino";
import { ENV, logger } from "../config";
import { msgRetryCounterCache } from "../services/messages/retryCache";
import { storeMessage } from "../services/messages/store";
import {
  getCachedGroupMetadata,
  groupCache,
  setCachedGroupMetadata,
} from "../utils/core/groupMetadataCache";
import { getMessage } from "../utils/core/message";
import { jidManager } from "../utils/jids/jidManager";
import { shouldReconnect } from "./connectionUtils";
import { generateQR } from "./utils";

// Connection manager class to handle socket lifecycle
class WhatsAppConnection {
  private socket: WASocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private messageHandlers: ((socket: WASocket, ...args: any[]) => void)[] = [];
  private isConnecting = false;

  /**
   * Register a message handler that will be called with the current socket
   */
  public onMessage(handler: (socket: WASocket, ...args: any[]) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Get the current socket instance
   */
  public getSocket(): WASocket | null {
    return this.socket;
  }

  /**
   * Create a new WhatsApp connection
   */
  public async connect(): Promise<WASocket> {
    if (this.isConnecting) {
      logger.debug("Connection already in progress, waiting...");
      // Wait for the current connection attempt to complete
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.socket) {
        return this.socket;
      }
    }

    this.isConnecting = true;

    try {
      // Auth state management
      const { state, saveCreds } = await useMultiFileAuthState(
        join(__dirname, "../../storage/auth")
      );

      // Create the socket
      const socket = makeWASocket({
        auth: state,
        logger: P({
          level: "silent",
        }),
        generateHighQualityLinkPreview: true, // Enable high quality link previews
        markOnlineOnConnect: ENV.WA_MARK_ONLINE_ON_CONNECT,
        shouldIgnoreJid: (jid: string) => {
          return jidManager.shouldIgnoreJid(jid, socket.user?.id);
        },
        cachedGroupMetadata: async (jid) => {
          const metadata = await getCachedGroupMetadata(jid);
          if (!metadata) {
            // If we get a cache miss, fetch fresh metadata and cache it
            logger.debug(`Fetching fresh metadata for group ${jid}`);
            try {
              const freshMetadata = await socket.groupMetadata(jid);
              if (freshMetadata) {
                logger.debug(
                  `Successfully fetched fresh metadata for group ${jid}`
                );
                setCachedGroupMetadata(jid, freshMetadata);
                return freshMetadata;
              }
            } catch (error) {
              logger.debug(
                `Failed to fetch metadata for group ${jid}: ${error}`
              );
            }
          }
          return metadata;
        },
        msgRetryCounterCache,
        getMessage,
      });

      // Store the socket reference
      this.socket = socket;

      // Handle QR code and auth state
      if (!socket.authState.creds.registered) {
        generateQR(socket);
      }

      // Handle connection events
      socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
          const reconnect = shouldReconnect(lastDisconnect);

          logger.info(
            `Connection closed due to ${
              lastDisconnect?.error?.message || "unknown reason"
            }`
          );

          // Clear the current socket reference
          this.socket = null;

          if (reconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(
              `Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
            );

            // Wait before reconnecting to avoid rapid reconnection loops
            await new Promise((resolve) =>
              setTimeout(resolve, this.reconnectDelay)
            );

            try {
              await this.connect();
            } catch (error) {
              logger.error(
                `Reconnection attempt ${this.reconnectAttempts} failed:`,
                error
              );
            }
          } else if (!reconnect) {
            logger.info(
              "Permanent disconnection (e.g. logged out), not reconnecting"
            );
            this.reconnectAttempts = 0;
          } else {
            logger.error(
              `Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`
            );
            process.exit(1);
          }
        } else if (connection === "connecting") {
          logger.info("Connecting to WhatsApp...");
        } else if (connection === "open") {
          logger.success("WhatsApp connection established successfully");
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection

          // Attach message handlers to the new socket
          this.attachMessageHandlers(socket);
        }
      });

      // Save credentials whenever updated
      socket.ev.on("creds.update", saveCreds);

      // Handle group updates to keep cache in sync
      socket.ev.on("groups.update", async ([update]) => {
        if (!update.id || !socket) return;
        logger.debug(`Group update received for ${update.id}`);

        // Fetch fresh metadata and update cache
        try {
          const freshMetadata = await socket.groupMetadata(update.id);
          if (freshMetadata) {
            logger.debug(
              `Updating cache for group ${update.id} after group update`
            );
            setCachedGroupMetadata(update.id, freshMetadata);
          }
        } catch (error) {
          logger.debug(
            `Failed to fetch metadata for group ${update.id}, we might not be in this group anymore`
          );
          // If we can't fetch metadata, we should remove it from cache as we probably don't have access anymore
          groupCache.del(update.id);
        }
      });

      // Handle group participant updates to keep cache in sync
      socket.ev.on("group-participants.update", async (update) => {
        if (!socket) return;
        const { id, participants, action } = update;
        logger.debug(
          `Group participants ${action} in ${id}: ${participants.join(", ")}`
        );

        // Fetch fresh metadata and update cache
        try {
          const freshMetadata = await socket.groupMetadata(id);
          if (freshMetadata) {
            logger.debug(
              `Updating cache for group ${id} after participant ${action}`
            );
            setCachedGroupMetadata(id, freshMetadata);
          }
        } catch (error) {
          logger.debug(
            `Failed to fetch metadata for group ${id}, we might not be in this group anymore`
          );
          // If we can't fetch metadata, we should remove it from cache as we probably don't have access anymore
          groupCache.del(id);
        }
      });

      this.isConnecting = false;
      return socket;
    } catch (error) {
      this.isConnecting = false;
      logger.error("Failed to create WhatsApp connection:", error);
      throw error;
    }
  }

  /**
   * Attach all registered message handlers to the socket
   */
  private attachMessageHandlers(socket: WASocket): void {
    logger.debug(
      `Attaching ${this.messageHandlers.length} message handlers to socket`
    );

    // Handle message upserts - new messages and updates
    socket.ev.on("messages.upsert", async ({ messages, type }) => {
      // Log message type (notify for new messages, append for history sync)
      logger.debug(`Received messages.upsert of type ${type}`);

      for (const message of messages) {
        // Store message in cache if it has an ID and message content
        // Fixed: Check for message existence and proper structure
        if (message.key?.id && message.key?.remoteJid && message.message) {
          try {
            storeMessage(message.key, message.message);
          } catch (error) {
            logger.error("Error storing message:", error);
          }
        }

        // Call each registered message handler
        for (const handler of this.messageHandlers) {
          try {
            await handler(socket, message);
          } catch (error) {
            logger.error("Error in message handler:", error);
          }
        }
      }
    });

    // Handle message updates (read status, delete, etc.)
    socket.ev.on("messages.update", async (updates) => {
      logger.debug(`Received ${updates.length} message updates`);
      for (const { key, update } of updates) {
        logger.debug("Message update for:", { key, update });

        // If the message was deleted, remove it from store
        if (update.messageStubType === 1) {
          // REVOKE type
          try {
            // You might want to implement a delete function in store.ts
            logger.debug(`Message ${key.id} was deleted`);
          } catch (error) {
            logger.error("Error handling message deletion:", error);
          }
        }
      }
    });

    // Handle message reaction updates
    socket.ev.on("messages.reaction", (reactions) => {
      //logger.debug("Message reactions received:", reactions);
    });

    // Handle receipt updates (read, delivery)
    socket.ev.on("message-receipt.update", (receipts) => {
      //logger.debug("Message receipt updates:", receipts);
    });
  }

  /**
   * Gracefully disconnect the socket
   */
  public async disconnect(): Promise<void> {
    if (this.socket) {
      logger.info("Disconnecting WhatsApp socket...");
      try {
        await this.socket.logout();
      } catch (error) {
        logger.debug("Error during logout:", error);
      }
      this.socket = null;
    }
  }
}

// Create a singleton instance
const whatsappConnection = new WhatsAppConnection();

// Export the connection manager instance and legacy function for backward compatibility
export const connectionManager = whatsappConnection;

export async function createConnection(): Promise<WASocket> {
  return await whatsappConnection.connect();
}

export default createConnection;
