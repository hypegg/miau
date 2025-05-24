import { translations as enTranslations } from "./en";
import { translations as esTranslations } from "./es";
import { translations as ptTranslations } from "./pt";

// Import command-specific translations
import { audioTranslations } from "./commands/audio";
import { stickerTranslations } from "./commands/sticker";
import { videoTranslations } from "./commands/video";
import { helpTranslations } from "./commands/help";

export type Language = "en" | "es" | "pt";

// Build complete translation objects for each language
const buildLanguageTranslations = (lang: Language) => {
  const coreTranslations = {
    en: enTranslations,
    es: esTranslations,
    pt: ptTranslations,
  }[lang];

  const commandTranslations = {
    help: helpTranslations[lang],
    audio: audioTranslations[lang],
    sticker: stickerTranslations[lang],
    video: videoTranslations[lang],
  };

  return {
    ...coreTranslations,
    ...commandTranslations,
  };
};

export const availableLanguages: Language[] = ["en", "es", "pt"];

export const translations = {
  en: buildLanguageTranslations("en"),
  es: buildLanguageTranslations("es"),
  pt: buildLanguageTranslations("pt"),
} as const;

export type TranslationsType = (typeof translations)["en"];
