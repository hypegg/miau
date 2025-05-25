import { logger } from "../../config";

export class JidIgnoreManager {
  private ignoredJids: Set<string> = new Set();
  private ignoredPatterns: RegExp[] = [];

  /**
   * Check if a JID should be ignored based on configured rules
   */
  public shouldIgnoreJid(jid: string, botJid?: string): boolean {
    if (!jid) return true;

    // Status updates (WhatsApp status broadcast)
    if (jid === "status@broadcast") {
      logger.debug(`Ignoring status broadcast message from ${jid}`);
      return true;
    }

    // WhatsApp official announcements
    if (jid.includes("@newsletter") || jid.includes("announcement")) {
      logger.debug(`Ignoring announcement/newsletter message from ${jid}`);
      return true;
    }

    // Bot's own messages (prevent self-loops)
    if (botJid && jid.includes(botJid.split(":")[0])) {
      logger.debug(`Ignoring own message from ${jid}`);
      return true;
    }

    // Check exact JID matches in ignore list
    if (this.ignoredJids.has(jid)) {
      logger.debug(`Ignoring message from explicitly ignored JID: ${jid}`);
      return true;
    }

    // Check pattern matches
    for (const pattern of this.ignoredPatterns) {
      if (pattern.test(jid)) {
        logger.debug(`Ignoring message from JID matching pattern: ${jid}`);
        return true;
      }
    }

    // Check for temporary/invalid JIDs
    if (jid.includes("temp") || jid.includes("invalid")) {
      logger.debug(`Ignoring temporary/invalid JID: ${jid}`);
      return true;
    }

    // Only process messages from individual chats and groups
    const isValidChat =
      jid.endsWith("@s.whatsapp.net") || jid.endsWith("@g.us");
    if (!isValidChat) {
      logger.debug(`Ignoring message from non-standard JID format: ${jid}`);
      return true;
    }

    return false;
  }

  /**
   * Add a JID to the ignore list
   */
  public addIgnoredJid(jid: string): void {
    this.ignoredJids.add(jid);
    logger.info(`Added JID to ignore list: ${jid}`);
  }

  /**
   * Remove a JID from the ignore list
   */
  public removeIgnoredJid(jid: string): void {
    this.ignoredJids.delete(jid);
    logger.info(`Removed JID from ignore list: ${jid}`);
  }

  /**
   * Add a pattern to ignore JIDs matching the pattern
   */
  public addIgnoredPattern(pattern: string): void {
    try {
      const regex = new RegExp(pattern);
      this.ignoredPatterns.push(regex);
      logger.info(`Added JID ignore pattern: ${pattern}`);
    } catch (error) {
      logger.error(`Invalid regex pattern for JID ignore: ${pattern}`, error);
    }
  }

  /**
   * Clear all ignored JIDs and patterns
   */
  public clearIgnoredJids(): void {
    this.ignoredJids.clear();
    this.ignoredPatterns = [];
    logger.info("Cleared all ignored JIDs and patterns");
  }

  /**
   * Get current ignored JIDs (for debugging/admin purposes)
   */
  public getIgnoredJids(): { jids: string[]; patterns: string[] } {
    return {
      jids: Array.from(this.ignoredJids),
      patterns: this.ignoredPatterns.map((p) => p.source),
    };
  }

  /**
   * Load ignored JIDs from a comma-separated string
   */
  public loadIgnoredJidsFromString(jidsString: string): void {
    const jids = jidsString.split(",").map((j) => j.trim());
    jids.forEach((jid: string) => this.ignoredJids.add(jid));
    logger.info(`Loaded ${jids.length} ignored JIDs`);
  }
}
