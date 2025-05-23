import { translations as enTranslations } from "./en";
import { translations as esTranslations } from "./es";
import { translations as ptTranslations } from "./pt";

export type Language = "en" | "es" | "pt";
export type TranslationsType = typeof enTranslations;

export const availableLanguages: Language[] = ["en", "es", "pt"];

export const translations = {
  en: enTranslations,
  es: esTranslations,
  pt: ptTranslations,
} as const;
