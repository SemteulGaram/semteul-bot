import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextCommandCallback } from '@/command-util';
import { tgReplyText, tgSendHelp, tgUnhandleError } from '@/utils/tg-macro';
import { RateLimitRuleListType } from '@/types/rate-limit';
import { timeStringFull } from '@/utils/time-string';
import { RateLimitService } from '@/rate-limit-service';
import { ReplyableError } from '@/utils/replyable-error';

const log = new Logger({
  parentHierarchy: ['cmd', 'rate-limit'],
});

/**
 * Apply rate limit management commands to the bot
 * @param ctx KyushBot instance
 */
export function applyBotCommandRateLimit(ctx: KyushBot): void {
  log.i('Applying rate limit commands');

  // Command to set rate limit rule
  ctx.registerHelpMsg('setratelimit',
    `\`/setratelimit@${ctx.botId} [command] ['command'|'chat'|'user'] [value (0 for command type)] [limit_count] [period_ms]\`\n\\- Set a rate limit rule`
  );
  applyTextCommandCallback(ctx, 'setratelimit', true, async (msg, cmd, argstr): Promise<void> => {
    try {
      // Argument validation 
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+(command|chat|user)\s+(-?\d+)\s+(\d+)\s+(\d+)\s*$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      
      const command = matches[1].toLowerCase();
      const listType = matches[2] as RateLimitRuleListType;
      const value = parseInt(matches[3], 10);
      const limitCount = parseInt(matches[4], 10);
      const period = parseInt(matches[5], 10);
      if (listType === 'command' && value !== 0) {
        return tgReplyText(ctx.bot, msg, 'Value must be 0 for command type');
      }
      if (limitCount < 1) {
        return tgReplyText(ctx.bot, msg, 'Limit count must be at least 1');
      }
      if (period < 1) {
        return tgReplyText(ctx.bot, msg, 'Period must be at least 1ms');
      }

      // Access the rate limit service through the global instance
      const rateLimitService = ctx.rateLimitService;
      if (!rateLimitService) {
        tgReplyText(ctx.bot, msg, 'Rate limit service is not available');
        return;
      }

      const success = rateLimitService.upateRule(
        command,
        listType,
        value,
        limitCount,
        period
      );

      if (success) {
        log.iH([cmd], `Successfully set rate limit for ${command} ${listType} ${value}`);
        tgReplyText(ctx.bot, msg,
          `Rate limit for /${command} ${listType} ${value} set to ${limitCount} requests per ${timeStringFull(period)}`
        );
      } else {
        log.iH([cmd], `Failed to set rate limit for ${command} ${listType} ${value}`);
        tgReplyText(ctx.bot, msg, 'Failed to set rate limit. Please try again.');
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });

  // Command to remove a rate limit rule
  ctx.registerHelpMsg('removeratelimit',
    `\`/removeratelimit@${ctx.botId} [command] ['command'|'chat'|'user'] [value (0 for command type)]\`\n\\- Remove a rate limit rule`
  );
  applyTextCommandCallback(ctx, 'removeratelimit', true, async (msg, cmd, argstr): Promise<void> => {
    try {
      // Argument validation
      if (!argstr) return tgSendHelp(ctx, msg, cmd);
      const matches = argstr.match(/^\s*([\S]+)\s+(command|chat|user)\s+(-?\d+)\s*$/);
      if (!matches) return tgSendHelp(ctx, msg, cmd);
      
      const command = matches[1].toLowerCase();
      const listType = matches[2] as RateLimitRuleListType;
      const value = parseInt(matches[3], 10);

      const success = ctx.rateLimitService.removeRule(
        command,
        listType,
        value
      );

      if (success) {
        log.iH([cmd], `Successfully removed rate limit for ${command} ${listType} ${value}`);
        tgReplyText(ctx.bot, msg,
          `Rate limit for /${command} ${listType} ${value} has been removed`
        );
      } else {
        log.iH([cmd], `Failed to remove rate limit for ${command} ${listType} ${value}`);
        tgReplyText(ctx.bot, msg, 'Failed to remove rate limit. Please check if the rule exists.');
      }
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });

  // Command to list all rate limit rules
  ctx.registerHelpMsg('listratelimits',
    `\`/listratelimits@${ctx.botId}\`\n\\- List all rate limit rules`
  );
  applyTextCommandCallback(ctx, 'listratelimits', true, async (msg, cmd): Promise<void> => {
    try {
      // Access the rate limit service through the global instance
      const rateLimitService = ctx.rateLimitService;
      if (!rateLimitService) {
        tgReplyText(ctx.bot, msg, 'Rate limit service is not available');
        return;
      }
      
      const rules = rateLimitService.rulesToString();
      
      if (!rules || rules.trim() === '[command] [list_type] [value] [limit_count] [period]') {
        tgReplyText(ctx.bot, msg, 'No rate limit rules defined.');
        return;
      }
      
      log.iH(['listratelimits'], 'Listing rate limit rules');
      tgReplyText(ctx.bot, msg, `Current rate limit rules:\n\`\`\`csv\n${rules}\n\`\`\``, { parse_mode: 'MarkdownV2' });
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });
}