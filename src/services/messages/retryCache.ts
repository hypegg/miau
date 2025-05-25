import { LRUCache } from "lru-cache";
import { logger } from "../../config/logger";

// Create an LRU cache to store message retry counts
const retryCounterCache = new LRUCache<string, number>({
  max: 1000, // Store up to 1000 message retry counts
  ttl: 1000 * 60 * 5, // Retry counts expire after 5 minutes
  updateAgeOnGet: true, // Update the "freshness" when counts are retrieved
});

/**
 * Message retry counter cache implementation
 * Used by Baileys to track message retry attempts
 * Implements the generic CacheStore interface expected by Baileys
 */
export const msgRetryCounterCache = {
  get: <T>(key: string): T | undefined => {
    try {
      const value = retryCounterCache.get(key);
      logger.debug(`Retrieved retry count for ${key}: ${value || 0}`);
      // Cast to T as Baileys will always expect number for retry counts
      return value as unknown as T;
    } catch (error) {
      logger.error("Error retrieving retry count:", error);
      return undefined;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      // Baileys will always pass a number for retry counts, so cast it
      const numValue =
        typeof value === "number" ? value : (value as unknown as number) || 0;
      retryCounterCache.set(key, numValue);
      logger.debug(`Set retry count for ${key}: ${numValue}`);
    } catch (error) {
      logger.error("Error setting retry count:", error);
    }
  },

  add: (key: string): number => {
    try {
      const currentCount = retryCounterCache.get(key) || 0;
      const newCount = currentCount + 1;
      retryCounterCache.set(key, newCount);
      logger.debug(
        `Incremented retry count for ${key}: ${currentCount} -> ${newCount}`
      );
      return newCount;
    } catch (error) {
      logger.error("Error incrementing retry count:", error);
      return 1;
    }
  },

  del: (key: string): boolean => {
    try {
      const deleted = retryCounterCache.delete(key);
      if (deleted) {
        logger.debug(`Deleted retry count for ${key}`);
      }
      return deleted;
    } catch (error) {
      logger.error("Error deleting retry count:", error);
      return false;
    }
  },

  flushAll: (): void => {
    try {
      const size = retryCounterCache.size;
      retryCounterCache.clear();
      logger.debug(`Flushed ${size} retry count entries`);
    } catch (error) {
      logger.error("Error flushing retry counter cache:", error);
    }
  },
};
