import { WASocket } from "baileys";
import qrcode from "qrcode";
import { logger } from "../config/logger";

export const generateQR = (socket: WASocket): void => {
  // Remove any existing QR listeners to prevent duplicates
  socket.ev.removeAllListeners("connection.update");

  socket.ev.on("connection.update", async ({ qr, connection }) => {
    if (qr) {
      logger.info("Authentication required - generating QR code...");
      try {
        // Generate the QR code string
        const qrString = await qrcode.toString(qr, {
          type: "terminal",
          small: true,
          margin: 1,
          scale: 1,
        });

        logger.info(
          "QR Code generated. Scan it with WhatsApp to authenticate."
        );
        logger.separator("QR Code");
        console.log(qrString);
        logger.separator();
        logger.info("Waiting for QR code scan...");
      } catch (error) {
        logger.error("Failed to generate QR code:", error);
      }
    }
  });
};

export default { generateQR };
