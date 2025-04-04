import { z } from 'zod';
import { Logger } from '@/logger';
import { KyuSqlite3Database } from '@/database/base';
import { RateLimitLogTable, RateLimitRuleSchema, RateLimitRuleTable } from '@/database/rate-limit';
import { RateLimitCheckResult, RateLimitRuleListType } from '@/types/rate-limit';
import { timeStringFull } from './utils/time-string';
import { KyushBot } from './kyushbot';
import { ReplyableError } from './utils/replyable-error';

const log = new Logger({
  parentHierarchy: ['rate-limit'],
});

export class RateLimitService {
  private rateLimitRuleTable: RateLimitRuleTable;
  private rateLimitLogTable: RateLimitLogTable;
  private rules: Record<string, z.infer<typeof RateLimitRuleSchema>> = {};

  static formatRuleName(command: string, listType: RateLimitRuleListType, value: number): string {
    return `${command}_${listType}_${value}`;
  }

  constructor(private ctx: KyushBot, configDb: KyuSqlite3Database, logDb: KyuSqlite3Database) {
    log.i('Initializing RateLimitService');
    this.rateLimitRuleTable = RateLimitRuleTable.open(configDb);
    this.rateLimitLogTable = RateLimitLogTable.open(logDb);
    this.fetchRules();
  }

  private fetchRules(): void {
    log.i('Fetching rate limit rules');
    this.rules = {};
    const allRules = this.rateLimitRuleTable.queryAll();
    for (const rule of allRules) {
      this.rules[RateLimitService.formatRuleName(rule.command, rule.list_type, rule.value)] = rule;
    }
  }

  upateRule (command: string, listType: RateLimitRuleListType, value: number, limitCount: number, period: number): boolean {
    if (!this.ctx.aclService.isCommandRegistered(command)) {
      throw new ReplyableError(`Command ${command} is not registered`);
    }
    const rule = RateLimitRuleSchema.parse({
      command,
      list_type: listType,
      value,
      limit_count: limitCount,
      period: period,
    });
    log.i('Updating rate limit rule:', rule);
    
    let result = false;
    if (this.rateLimitRuleTable.queryRule(rule.command, rule.list_type, rule.value)) {
      result = this.rateLimitRuleTable.update(rule); 
    } else {
      result = this.rateLimitRuleTable.create(rule);
    }
    if (result) {
      this.fetchRules();
    } else {
      log.w('Failed to update rate limit rule:', rule);
    }
    return result;
  }

  removeRule (command: string, listType: RateLimitRuleListType, value: number): boolean {
    const ruleName = RateLimitService.formatRuleName(command, listType, value);
    log.i('Removing rate limit rule:', ruleName);
    const result = this.rateLimitRuleTable.remove(command, listType, value);
    if (result) {
      this.fetchRules();
    } else {
      log.w('Failed to remove rate limit rule:', ruleName);
    }
    return result;
  }

  rulesToString (): string {
    const result: string[] = [
      `[command] [list_type] [value] [limit_count] [period]`
    ];
    for (const rule of Object.values(this.rules)) {
      result.push(`${rule.command} ${rule.list_type} ${rule.value} ${rule.limit_count} ${rule.period}`);
    }
    return result.join('\n');
  }

  checkRateLimit (command: string, userId: number, chatId: number, onlyCheck = false): RateLimitCheckResult {
    const commandRule = this.rules[RateLimitService.formatRuleName(command, 'command', 0)];
    const chatRule = this.rules[RateLimitService.formatRuleName(command, 'chat', chatId)];
    const userRule = this.rules[RateLimitService.formatRuleName(command, 'user', userId)];
    const now = Date.now();

    if (commandRule) {
      const { limit_count, period } = commandRule;
      const count = this.rateLimitLogTable.queryCommandCount(command, now - period);
      log.t('Checking rate limit for command:', command, 'count:', count, 'limit:', limit_count, 'period:', period);
      if (count >= limit_count) {
        return {
          granted: false,
          denyMessage: `Rate limit exceeded for command: ${command} (limit: ${limit_count}, period: ${timeStringFull(period)})`,
        };
      }
    }
    
    if (chatRule) {
      const { limit_count, period } = chatRule;
      const count = this.rateLimitLogTable.queryChatCommandCount(chatId, command, now - period);
      log.t('Checking rate limit for chat:', chatId, 'command:', command, 'count:', count, 'limit:', limit_count, 'period:', period);
      if (count >= limit_count) {
        return {
          granted: false,
          denyMessage: `Rate limit exceeded for chat: ${command} (limit: ${limit_count}, period: ${timeStringFull(period)})`,
        };
      }
    }
    
    if (userRule) {
      const { limit_count, period } = userRule;
      const count = this.rateLimitLogTable.queryUserCommandCount(userId, command, now - period);
      log.t('Checking rate limit for user:', userId, 'command:', command, 'count:', count, 'limit:', limit_count, 'period:', period);
      if (count >= limit_count) {
        return {
          granted: false,
          denyMessage: `Rate limit exceeded for user: ${command} (limit: ${limit_count}, period: ${timeStringFull(period)})`,
        };
      }
    }

    // Granted
    if (!onlyCheck) {
      this.rateLimitLogTable.create({
        command,
        user_id: userId,
        chat_id: chatId,
        issue_at: now
      });
    }
    
    return {
      granted: true,
      denyMessage: undefined,
    };
  }
}
