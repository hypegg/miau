import NodeCache from "node-cache";
import { logger } from "../../config";
import { GroupMetadata } from "baileys";

// Initialize cache with 6 hours standard TTL
export const groupCache = new NodeCache({
  stdTTL: 21600, // 6 hours in seconds
  checkperiod: 600, // Check for expired entries every 10 minutes
  useClones: false, // Store/retrieve actual references
});

// Log cache statistics on periodic cleanup
groupCache.on("periodic", () => {
  const stats = groupCache.getStats();
  logger.debug(
    `Cache stats - Keys: ${stats.keys}, Hits: ${stats.hits}, Misses: ${stats.misses}, TTL Expired: ${stats.vsize}`
  );
});

/**
 * Gets group metadata from cache or returns undefined if not found
 * @param jid The group JID
 * @returns The cached group metadata or undefined
 */
export async function getCachedGroupMetadata(
  jid: string
): Promise<GroupMetadata | undefined> {
  const metadata = groupCache.get<GroupMetadata>(jid);
  logger.debug(`Group metadata cache ${metadata ? "HIT" : "MISS"} for ${jid}`);
  if (metadata) {
    logger.debug(
      `Cached metadata for ${jid}: ${metadata.subject}, Members: ${metadata.participants?.length}`
    );
  }
  return metadata;
}

/**
 * Stores group metadata in cache
 * @param jid The group JID
 * @param metadata The group metadata to cache
 */
export function setCachedGroupMetadata(
  jid: string,
  metadata: GroupMetadata
): void {
  groupCache.set(jid, metadata);
  logger.debug(
    `Cached group metadata for ${jid} - Group: ${metadata.subject}, Members: ${metadata.participants?.length}`
  );
}
