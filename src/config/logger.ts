import fs from "fs";
import path from "path";
import { ENV } from "./environment";

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../../../storage/logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

// Enhanced logger with colors and better formatting
class Logger {
  private logLevel: number;
  private levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  };

  private levelConfig = {
    error: {
      color: colors.red,
      bgColor: colors.bgRed,
      emoji: "❌",
      label: "ERROR",
    },
    warn: {
      color: colors.yellow,
      bgColor: colors.bgYellow,
      emoji: "⚠️ ",
      label: "WARN ",
    },
    info: {
      color: colors.blue,
      bgColor: colors.bgBlue,
      emoji: "ℹ️ ",
      label: "INFO ",
    },
    debug: {
      color: colors.magenta,
      bgColor: colors.bgBlue,
      emoji: "🐛",
      label: "DEBUG",
    },
  };

  constructor() {
    this.logLevel = this.getLevelNumber(ENV.LOG_LEVEL);
  }

  private getLevelNumber(level: string): number {
    return this.levels[level as keyof typeof this.levels] || 2; // Default to info
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  private formatConsoleMessage(
    level: keyof typeof this.levelConfig,
    message: string,
    ...args: any[]
  ): string {
    const config = this.levelConfig[level];
    const timestamp = this.formatTimestamp();
    const timestampColored = `${colors.gray}[${timestamp}]${colors.reset}`;
    const levelColored = `${config.color}${colors.bright}[${config.emoji} ${config.label}]${colors.reset}`;
    const messageColored = `${config.color}${message}${colors.reset}`;

    let formattedArgs = "";
    if (args.length > 0) {
      formattedArgs = args
        .map((arg) => {
          if (typeof arg === "object") {
            return `${colors.cyan}${JSON.stringify(arg, null, 2)}${
              colors.reset
            }`;
          }
          return `${colors.gray}${arg}${colors.reset}`;
        })
        .join(" ");
    }

    return `${timestampColored} ${levelColored} ${messageColored}${
      formattedArgs ? " " + formattedArgs : ""
    }`;
  }

  private logToFile(level: string, message: string, ...args: any[]): void {
    const date = new Date();
    const logFile = path.join(
      logsDir,
      `${date.toISOString().split("T")[0]}.log`
    );

    const timestamp = date.toISOString();
    const formattedArgs = args.length ? JSON.stringify(args) : "";
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}${
      formattedArgs ? " " + formattedArgs : ""
    }\n`;

    try {
      fs.appendFileSync(logFile, logMessage);
    } catch (err) {
      console.error(
        `${colors.red}Failed to write to log file:${colors.reset}`,
        err
      );
    }
  }

  // Enhanced logging methods with better formatting
  error(message: string, ...args: any[]): void {
    if (this.logLevel >= this.levels.error) {
      const formattedMessage = this.formatConsoleMessage(
        "error",
        message,
        ...args
      );
      console.error(formattedMessage);
      this.logToFile("error", message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.logLevel >= this.levels.warn) {
      const formattedMessage = this.formatConsoleMessage(
        "warn",
        message,
        ...args
      );
      console.warn(formattedMessage);
      this.logToFile("warn", message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel >= this.levels.info) {
      const formattedMessage = this.formatConsoleMessage(
        "info",
        message,
        ...args
      );
      console.info(formattedMessage);
      this.logToFile("info", message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel >= this.levels.debug) {
      const formattedMessage = this.formatConsoleMessage(
        "debug",
        message,
        ...args
      );
      console.debug(formattedMessage);
      this.logToFile("debug", message, ...args);
    }
  }

  // Additional utility methods for better WhatsApp bot logging
  whatsapp(message: string, ...args: any[]): void {
    const timestamp = this.formatTimestamp();
    const timestampColored = `${colors.gray}[${timestamp}]${colors.reset}`;
    const whatsappColored = `${colors.green}${colors.bright}[📱 WHATSAPP]${colors.reset}`;
    const messageColored = `${colors.green}${message}${colors.reset}`;

    let formattedArgs = "";
    if (args.length > 0) {
      formattedArgs = args
        .map((arg) => {
          if (typeof arg === "object") {
            return `${colors.cyan}${JSON.stringify(arg, null, 2)}${
              colors.reset
            }`;
          }
          return `${colors.gray}${arg}${colors.reset}`;
        })
        .join(" ");
    }

    const fullMessage = `${timestampColored} ${whatsappColored} ${messageColored}${
      formattedArgs ? " " + formattedArgs : ""
    }`;

    if (this.logLevel >= this.levels.info) {
      console.info(fullMessage);
      this.logToFile("whatsapp", message, ...args);
    }
  }

  command(command: string, user: string, ...args: any[]): void {
    const timestamp = this.formatTimestamp();
    const timestampColored = `${colors.gray}[${timestamp}]${colors.reset}`;
    const commandColored = `${colors.yellow}${colors.bright}[⚡ COMMAND]${colors.reset}`;
    const userColored = `${colors.cyan}${user}${colors.reset}`;
    const commandNameColored = `${colors.yellow}${colors.bright}/${command}${colors.reset}`;

    let formattedArgs = "";
    if (args.length > 0) {
      formattedArgs = args
        .map((arg) => {
          if (typeof arg === "object") {
            return `${colors.cyan}${JSON.stringify(arg, null, 2)}${
              colors.reset
            }`;
          }
          return `${colors.gray}${arg}${colors.reset}`;
        })
        .join(" ");
    }

    const fullMessage = `${timestampColored} ${commandColored} User ${userColored} executed ${commandNameColored}${
      formattedArgs ? " with args: " + formattedArgs : ""
    }`;

    if (this.logLevel >= this.levels.info) {
      console.info(fullMessage);
      this.logToFile("command", `User ${user} executed /${command}`, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    const timestamp = this.formatTimestamp();
    const timestampColored = `${colors.gray}[${timestamp}]${colors.reset}`;
    const successColored = `${colors.green}${colors.bright}[✅ SUCCESS]${colors.reset}`;
    const messageColored = `${colors.green}${message}${colors.reset}`;

    let formattedArgs = "";
    if (args.length > 0) {
      formattedArgs = args
        .map((arg) => {
          if (typeof arg === "object") {
            return `${colors.cyan}${JSON.stringify(arg, null, 2)}${
              colors.reset
            }`;
          }
          return `${colors.gray}${arg}${colors.reset}`;
        })
        .join(" ");
    }

    const fullMessage = `${timestampColored} ${successColored} ${messageColored}${
      formattedArgs ? " " + formattedArgs : ""
    }`;

    if (this.logLevel >= this.levels.info) {
      console.info(fullMessage);
      this.logToFile("success", message, ...args);
    }
  }

  // Method to create separator lines for better readability
  separator(title?: string): void {
    const line = colors.gray + "─".repeat(60) + colors.reset;
    if (title) {
      const titleColored = `${colors.bright}${colors.white} ${title} ${colors.reset}`;
      const titleLine =
        colors.gray +
        "─".repeat(20) +
        titleColored +
        colors.gray +
        "─".repeat(20) +
        colors.reset;
      console.log(titleLine);
    } else {
      console.log(line);
    }
  }

  // Method to log bot startup information
  startup(botName: string, version: string): void {
    this.separator();
    console.log(
      `${colors.bright}${colors.green}🤖 ${botName} v${version} Starting...${colors.reset}`
    );
    console.log(
      `${colors.gray}Log Level: ${colors.cyan}${ENV.LOG_LEVEL}${colors.reset}`
    );
    console.log(
      `${colors.gray}Logs Directory: ${colors.cyan}${logsDir}${colors.reset}`
    );
    this.separator();
  }
}

export const logger = new Logger();
export default logger;
