/**
 * ACL Types for the Telegram Bot
 */

/**
 * Access control list types for commands
 */
export enum AclListType {
  USER_WHITELIST = "user_whitelist",
  USER_BLACKLIST = "user_blacklist",
  CHAT_WHITELIST = "chat_whitelist",
  CHAT_BLACKLIST = "chat_blacklist",
  ROLE_WHITELIST = "role_whitelist",
  ROLE_BLACKLIST = "role_blacklist",
}

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  /**
   * Whether the permission is granted
   */
  granted: boolean;
  
  /**
   * Message to show when permission is denied
   */
  denyMessage?: string;
}
