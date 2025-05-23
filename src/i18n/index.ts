import { ENV } from "../config";
import {
  availableLanguages,
  Language,
  translations,
  TranslationsType,
} from "./translations";

type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${DeepKeys<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationKey = DeepKeys<TranslationsType>;

/**
 * Gets a translated message based on the current language setting
 * @param path - Path to the translation
 * @param replacements - Optional object with key-value pairs for string replacements
 * @returns Translated string
 */
export function t(
  path: TranslationKey,
  replacements: Record<string, string> = {}
): string {
  const lang = ENV.BOT_LANGUAGE as Language;

  // Validate language and fallback to English if invalid
  const validLang = availableLanguages.includes(lang) ? lang : "en";
  const langTranslations = translations[validLang];

  // Convert path to array
  const pathArray = path.split(".");

  // Navigate through the translations object
  let result = pathArray.reduce(
    (obj: any, key: string) => obj?.[key],
    langTranslations
  );

  // If translation not found, try English as fallback
  if (result === undefined && validLang !== "en") {
    result = pathArray.reduce(
      (obj: any, key: string) => obj?.[key],
      translations.en
    );
  }

  // If still no translation found, return the path
  if (result === undefined) {
    return path;
  }

  // Replace any placeholders
  return Object.entries(replacements).reduce(
    (str, [key, value]) => str.replace(new RegExp(`{${key}}`, "g"), value),
    result
  );
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): Language[] {
  return availableLanguages;
}

/**
 * Validate if a language is supported
 */
export function isValidLanguage(lang: string): lang is Language {
  return availableLanguages.includes(lang as Language);
}

export default t;
