import { Boom } from "@hapi/boom";
import { DisconnectReason } from "baileys";
import { logger } from "../config";

/**
 * Determine if we should reconnect based on the disconnect reason
 */
export function shouldReconnect(lastDisconnect: any): boolean {
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
