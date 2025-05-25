import { JidIgnoreManager } from "../jids/ignoreJids";

/**
 * A class to manage JID (WhatsApp ID) operations including adding/removing JIDs to ignore list
 * and pattern matching for ignored JIDs.
 */
export class JidManager {
  private jidIgnoreManager = new JidIgnoreManager();

  /**
   * Add a JID to the ignore list
   */
  public addIgnoredJid(jid: string): void {
    this.jidIgnoreManager.addIgnoredJid(jid);
  }

  /**
   * Remove a JID from the ignore list
   */
  public removeIgnoredJid(jid: string): void {
    this.jidIgnoreManager.removeIgnoredJid(jid);
  }

  /**
   * Add a pattern to ignore JIDs matching the pattern
   */
  public addIgnoredPattern(pattern: string): void {
    this.jidIgnoreManager.addIgnoredPattern(pattern);
  }

  /**
   * Clear all ignored JIDs and patterns
   */
  public clearIgnoredJids(): void {
    this.jidIgnoreManager.clearIgnoredJids();
  }

  /**
   * Get current ignored JIDs (for debugging/admin purposes)
   */
  public getIgnoredJids(): { jids: string[]; patterns: string[] } {
    return this.jidIgnoreManager.getIgnoredJids();
  }

  /**
   * Check if a JID should be ignored
   */
  public shouldIgnoreJid(jid: string, currentUserId?: string): boolean {
    return this.jidIgnoreManager.shouldIgnoreJid(jid, currentUserId);
  }

  /**
   * Load ignored JIDs from a string
   */
  public loadIgnoredJidsFromString(jids: string): void {
    this.jidIgnoreManager.loadIgnoredJidsFromString(jids);
  }
}

// Create a singleton instance
export const jidManager = new JidManager();
