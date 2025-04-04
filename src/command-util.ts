import TelegramBot from 'node-telegram-bot-api';
import { Logger } from '@/logger';
import { KyushBot } from '@/kyushbot';

const log = new Logger({
  parentHierarchy: ['cmd', 'util'],
});

/**
 * Apply a text command callback with ACL check
 * @param ctx KyushBot instance
 * @param cmd Command name
 * @param enforceCommandBotTag Enforcing that command must be executed with bot tag
 * @param callback Callback function to execute if permission is granted
 */
export function applyTextCommandCallback(
  ctx: KyushBot,
  cmd: string,
  enforceCommandBotTag: boolean = false,
  callback: (msg: TelegramBot.Message, cmd: string, argstr: string | null) => void,
): void {
  if (ctx.aclService) {
    ctx.aclService.registerCommand(cmd);
  }

  let regex: RegExp;
  if (enforceCommandBotTag) {
    regex = new RegExp(`^\\/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})(?: (.*))?$`, 'is');
  } else {
    regex = new RegExp(`^\\/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})?(?: (.*))?$`, 'is');
  }

  ctx.bot.onText(
    regex,
    async (msg, match) => {
      // Check permissions if ACL service is provided
      if (ctx.aclService && msg.from) {
        const permissionResult = ctx.aclService.canExecute(cmd, String(msg.from.id), String(msg.chat.id));
        
        if (!permissionResult.granted) {
          log.info(`Permission denied for user ${msg.from.id} in chat ${msg.chat.id}`
            + (permissionResult.denyMessage ? ` with message: ${permissionResult.denyMessage}` : '')
          );
          
          // Send permission denied message if one is provided
          if (permissionResult.denyMessage) {
            ctx.bot.sendMessage(msg.chat.id, permissionResult.denyMessage, {
              reply_to_message_id: msg.message_id,
            });
          }
          return;
        }
        
        log.trace(`Permission granted for user ${msg.from.id} in chat ${msg.chat.id}`);
      }

      // Rate limit check
      if (ctx.rateLimitService && msg.from) {
        const rateLimitResult = ctx.rateLimitService.checkRateLimit(cmd, Number(msg.from.id), Number(msg.chat.id));
        if (!rateLimitResult.granted) {
          log.iH([cmd], `Rate limit exceeded for user ${msg.from.id} in chat ${msg.chat.id} command: ${cmd} with message: ${rateLimitResult.denyMessage}`);
          if (rateLimitResult.denyMessage) {
            ctx.bot.sendMessage(msg.chat.id, rateLimitResult.denyMessage, {
              reply_to_message_id: msg.message_id,
            });
          }
          return;
        }
      }
      
      // Execute the command if permitted
      const argstr = match ? match[1] : null;
      callback(msg, cmd, argstr);
    }
  );
}

export function applyTextIncludeCaptionCommandCallback(
  ctx: KyushBot,
  cmd: string,
  enforceCommandBotTag: boolean = false,
  callback: (msg: TelegramBot.Message, cmd: string, argstr: string | null) => void,
): void {
  if (ctx.aclService) {
    ctx.aclService.registerCommand(cmd);
  }

  let regex: RegExp;
  if (enforceCommandBotTag) {
    regex = new RegExp(`^\\/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})(?: (.*))?$`, 'is');
  } else {
    regex = new RegExp(`^\\/${cmd}(?:@${process.env.TELEGRAM_BOT_ID})?(?: (.*))?$`, 'is');
  }

  ctx.bot.on('message', async (msg) => {
    const text = msg.text || msg.caption || '';
    const match = text.match(regex);
    if (!match) return;

    // Check permissions if ACL service is provided
    if (ctx.aclService && msg.from) {
      const permissionResult = ctx.aclService.canExecute(cmd, String(msg.from.id), String(msg.chat.id));
      
      if (!permissionResult.granted) {
        log.info(`Permission denied for user ${msg.from.id} in chat ${msg.chat.id}`
          + (permissionResult.denyMessage ? ` with message: ${permissionResult.denyMessage}` : '')
        );
        
        // Send permission denied message if one is provided
        if (permissionResult.denyMessage) {
          ctx.bot.sendMessage(msg.chat.id, permissionResult.denyMessage, {
            reply_to_message_id: msg.message_id,
          });
        }
        return;
      }
      
      log.trace(`Permission granted for user ${msg.from.id} in chat ${msg.chat.id}`);
    }

    // Rate limit check
    if (ctx.rateLimitService && msg.from) {
      const rateLimitResult = ctx.rateLimitService.checkRateLimit(cmd, Number(msg.from.id), Number(msg.chat.id));
      if (!rateLimitResult.granted) {
        log.iH([cmd], `Rate limit exceeded for user ${msg.from.id} in chat ${msg.chat.id} command: ${cmd} with message: ${rateLimitResult.denyMessage}`);
        if (rateLimitResult.denyMessage) {
          ctx.bot.sendMessage(msg.chat.id, rateLimitResult.denyMessage, {
            reply_to_message_id: msg.message_id,
          });
        }
        return;
      }
    }
    
    // Execute the command if permitted
    const argstr = match ? match[1] : null;
    callback(msg, cmd, argstr);
  });
}