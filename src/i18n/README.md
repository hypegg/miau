# Internationalization (i18n) System

A robust and type-safe internationalization system that provides multilingual support for the application. This system enables seamless translation management and localization of content across English (en), Spanish (es), and Portuguese (pt).

## Overview

The i18n system is built with TypeScript and provides:

- Full type safety for translation keys
- Support for nested translation structures
- Dynamic placeholder replacement
- Fallback to English for missing translations
- Easy language validation and management

## Key Features

- **Type-Safe Translation Keys**: Utilizes TypeScript's type system to ensure translation keys are valid at compile time
- **Multiple Language Support**: Currently supports:
  - English (en)
  - Spanish (es)
  - Portuguese (pt)
- **Nested Translations**: Supports deeply nested translation structures with dot notation
- **Dynamic Content**: Handles dynamic content through placeholder replacement
- **Fallback System**: Automatically falls back to English when a translation is missing
- **Modular Structure**: Separates translations by command/feature for better maintainability

## Architecture

The i18n system is organized into several key components:

```
i18n/
├── index.ts              # Core translation functions and types
├── translations/
│   ├── index.ts         # Language configuration and type definitions
│   ├── en.ts            # English translations
│   ├── es.ts            # Spanish translations
│   ├── pt.ts            # Portuguese translations
│   └── commands/        # Command-specific translations
        ├── audio.ts
        ├── video.ts
        ├── sticker.ts
        └── help.ts
```

## Usage Guide

### Basic Translation

To translate a string, use the `t()` function:

```typescript
import t from "../i18n";

// Simple translation
const message = t("core.commandError");

// Translation with placeholders
const downloadStatus = t("video.providedUrl", { url: "https://example.com" });
```

### Adding New Translations

1. **Choose the Appropriate File**:

   - Core translations go in `translations/[lang].ts`
   - Command-specific translations go in `translations/commands/[command].ts`

2. **Add Translation Keys**:

   ```typescript
   // In your command translation file (e.g., commands/mycommand.ts)
   export const myCommandTranslations = {
     en: {
       name: "commandName",
       description: "Command description",
       success: "Operation successful: {result}",
     },
     es: {
       name: "nombreComando",
       description: "Descripción del comando",
       success: "Operación exitosa: {result}",
     },
     pt: {
       name: "nomeComando",
       description: "Descrição do comando",
       success: "Operação bem-sucedida: {result}",
     },
   } as const;
   ```

3. **Register the Translations**:
   - Import and add your translations in `translations/index.ts`
   - Add them to the `buildLanguageTranslations` function

### Using Placeholders

The system supports dynamic content through placeholders:

```typescript
// Single placeholder
t("video.providedUrl", { url: "https://example.com" });

// Multiple placeholders
t("custom.message", {
  user: "John",
  action: "download",
  item: "video",
});
```

### Validating Languages

You can validate language codes using the provided utility functions:

```typescript
import { isValidLanguage, getAvailableLanguages } from "../i18n";

// Check if a language is supported
const isValid = isValidLanguage("es"); // true

// Get list of all supported languages
const languages = getAvailableLanguages(); // ['en', 'es', 'pt']
```

## Type Safety

The system provides complete type safety for translation keys through TypeScript:

```typescript
// This will show a TypeScript error if the key doesn't exist
t("invalidKey.doesNotExist"); // TS Error

// Correct usage with proper type checking
t("video.downloadComplete"); // OK
```

## Contributing

When adding new translations:

1. Ensure all supported languages are included
2. Follow the existing structure for consistency
3. Use descriptive keys that reflect the content
4. Include placeholders where dynamic content is needed
5. Add any new languages to the `Language` type in `translations/index.ts`

## Best Practices

1. **Key Organization**:

   - Use dot notation for logical grouping
   - Keep keys descriptive and consistent
   - Group related translations together

2. **Placeholders**:

   - Use meaningful placeholder names
   - Document placeholders in comments
   - Keep placeholder names consistent across languages

3. **Maintenance**:
   - Keep translations up to date across all languages
   - Regular validation of translation completeness
   - Document any language-specific formatting requirements

## Language Support

To add support for a new language:

1. Add the language code to the `Language` type
2. Create translations for all existing keys
3. Add the language to `availableLanguages` array
4. Add translations to all command-specific files
5. Update the `buildLanguageTranslations` function
