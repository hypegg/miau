import dotenv from "dotenv";
import path from "path";
import { isValidLanguage } from "../i18n";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Validate and get language setting
const validateLanguage = (lang: string | undefined) => {
  if (!lang || !isValidLanguage(lang)) {
    return "en";
  }
  return lang;
};

// Environment configuration
export const ENV = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || "development",

  // Bot configuration
  BOT_NAME: process.env.BOT_NAME || "Miau",
  BOT_PREFIX: process.env.BOT_PREFIX || "/",
  BOT_SYSTEM_PROMPT:
    process.env.BOT_SYSTEM_PROMPT ||
    "You are ${BOT_NAME}, a helpful WhatsApp assistant. Keep responses concise and helpful.",
  BOT_LANGUAGE: validateLanguage(process.env.BOT_LANGUAGE), // Default language is English

  // Connection configuration
  WA_MARK_ONLINE_ON_CONNECT: process.env.WA_MARK_ONLINE_ON_CONNECT === "false",

  // Group chat configuration
  GROUP_CHAT_ENABLED: process.env.GROUP_CHAT_ENABLED === "true",
  GROUP_WHITELIST_ENABLED: process.env.GROUP_WHITELIST_ENABLED === "false",
  GROUP_WHITELIST: (process.env.GROUP_WHITELIST || "")
    .split(",")
    .filter(Boolean),
  GROUP_ADMIN_ONLY: process.env.GROUP_ADMIN_ONLY === "true",
  GROUP_MENTION_ONLY: process.env.GROUP_MENTION_ONLY === "true",
  GROUP_TRIGGER_WORDS: (process.env.GROUP_TRIGGER_WORDS || "")
    .split(",")
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean),

  // Context configuration
  PRIVATE_CHAT_HISTORY_LIMIT: parseInt(
    process.env.PRIVATE_CHAT_HISTORY_LIMIT || "10"
  ),
  GROUP_CHAT_HISTORY_LIMIT: parseInt(
    process.env.GROUP_CHAT_HISTORY_LIMIT || "15"
  ),

  // AI service configuration
  AI_PROVIDER: process.env.AI_PROVIDER || "openai", // "openai" or "groq"
  AI_API_KEY: process.env.AI_API_KEY || "",

  // OpenAI specific configuration
  OPENAI_API_URL: process.env.OPENAI_API_URL || "https://api.openai.com/v1",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-3.5-turbo",

  // Groq specific configuration
  GROQ_API_URL: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama3-70b-8192",

  // Common AI configuration
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  AI_MAX_COMPLETION_TOKENS: parseInt(
    process.env.AI_MAX_COMPLETION_TOKENS || "512"
  ),
  AI_TOP_P: parseFloat(process.env.AI_TOP_P || "1.0"),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

export default ENV;
