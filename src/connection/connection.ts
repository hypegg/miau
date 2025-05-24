import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "baileys";
import { join } from "path";
import P from "pino";
import { ENV, logger } from "../config";
import {
  getCachedGroupMetadata,
  groupCache,
  setCachedGroupMetadata,
} from "../utils/core/groupMetadataCache";
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
        markOnlineOnConnect: ENV.WA_MARK_ONLINE_ON_CONNECT,
      });

      // Store the socket reference
      this.socket = socket;

      // Generate QR code if needed
      if (!socket.authState.creds.registered) {
        logger.info("Authentication required - generating QR code...");
        generateQR(socket);
      }

      // Handle connection events
      socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === "close") {
          const shouldReconnect = this.shouldReconnect(lastDisconnect);

          logger.info(
            `Connection closed due to ${
              lastDisconnect?.error?.message || "unknown reason"
            }`
          );

          // Clear the current socket reference
          this.socket = null;

          if (
            shouldReconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
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
          } else if (!shouldReconnect) {
            logger.info("Disconnected due to logged out, not reconnecting");
            this.reconnectAttempts = 0;
          } else {
            logger.error(
              `Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`
            );
            process.exit(1);
          }
        } else if (connection === "open") {
          logger.success("WhatsApp connection established successfully");
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection

          // Attach message handlers to the new socket
          this.attachMessageHandlers(socket);
        } else if (connection === "connecting") {
          logger.info("Connecting to WhatsApp...");
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
   * Determine if we should reconnect based on the disconnect reason
   */
  private shouldReconnect(lastDisconnect: any): boolean {
    const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

    // Don't reconnect for permanent disconnections
    const permanentDisconnections = [
      DisconnectReason.loggedOut, // 401 - User logged out
      DisconnectReason.badSession, // 500 - Session corrupted
      DisconnectReason.forbidden, // 403 - Account forbidden/banned
      DisconnectReason.multideviceMismatch, // 411 - Device mismatch
    ];

    // Always reconnect for these temporary issues
    const temporaryDisconnections = [
      DisconnectReason.connectionClosed, // 428 - Connection closed
      DisconnectReason.connectionLost, // 408 - Connection lost
      DisconnectReason.timedOut, // 408 - Timed out
      DisconnectReason.unavailableService, // 503 - Service unavailable
    ];

    // Handle special cases
    if (statusCode === DisconnectReason.connectionReplaced) {
      // 440 - Connection replaced (another device connected)
      logger.info("Connection replaced by another device");
      return false;
    }

    if (statusCode === DisconnectReason.restartRequired) {
      // 515 - Restart required
      logger.info("WhatsApp server requested restart");
      return true;
    }

    // Check if it's a permanent disconnection
    if (permanentDisconnections.includes(statusCode)) {
      return false;
    }

    // Check if it's a known temporary disconnection
    if (temporaryDisconnections.includes(statusCode)) {
      return true;
    }

    // For unknown status codes, default to reconnect (but log it)
    logger.warn(
      `Unknown disconnect reason: ${statusCode}, attempting to reconnect`
    );
    return true;
  }

  /**
   * Attach all registered message handlers to the socket
   */
  private attachMessageHandlers(socket: WASocket): void {
    logger.debug(
      `Attaching ${this.messageHandlers.length} message handlers to socket`
    );

    // Attach messages.upsert handler
    socket.ev.on("messages.upsert", async ({ messages }) => {
      for (const message of messages) {
        for (const handler of this.messageHandlers) {
          try {
            await handler(socket, message);
          } catch (error) {
            logger.error("Error in message handler:", error);
          }
        }
      }
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
