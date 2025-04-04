export type RateLimitRuleListType = 'command' | 'chat' | 'user';
export const RateLimitRuleList = ['command', 'chat', 'user'] as const;

/**
 * Result of a rate limit check
 */
export interface RateLimitCheckResult {
  /**
   * Whether the rate limit check was granted
   */
  granted: boolean;
  /**
   * Message to show when rate limit is denied
   */
  denyMessage?: string;
}