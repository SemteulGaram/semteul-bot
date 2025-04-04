import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextCommandCallback } from '@/command-util';
import enkoConverter from '@/../external/enkoConverter.js';
import { tgSendHelp } from '@/utils/tg-macro';

const log = new Logger({
  parentHierarchy: ['cmd', 'enko'],
});

/**
 * Apply English to Korean and Korean to English on Qwerty keyboard commands to the bot
 * @param ctx KyushBot instance
 */
export function applyBotCommandEnko(ctx: KyushBot): void {
  // English to Korean (enko) command
  ctx.registerHelpMsg('enko',
    `\`/enko@${ctx.botId} [text]\`\n\\- Convert English to Korean`
  );
  applyTextCommandCallback(ctx, 'enko', false, (msg, cmd, argstr) => {
    if (!argstr) return tgSendHelp(ctx, msg, cmd);
    log.iH([cmd], argstr);
    ctx.bot.sendMessage(msg.chat.id, enkoConverter(true, argstr), {
      reply_to_message_id: msg.message_id,
    });
  });

  // English to Korean (영한) command - Korean command alias
  ctx.registerHelpMsg('영한',
    `\`/영한@${ctx.botId} [text]\`\n\\- Alias of \\/enko`
  );
  applyTextCommandCallback(ctx, '영한', false, (msg, cmd, argstr) => {
    if (!argstr) return tgSendHelp(ctx, msg, cmd);
    log.iH([cmd], argstr);
    ctx.bot.sendMessage(msg.chat.id, enkoConverter(true, argstr), {
      reply_to_message_id: msg.message_id,
    });
  });

  // Korean to English (koen) command
  ctx.registerHelpMsg('koen',
    `\`/koen@${ctx.botId} [text]\`\n\\- Convert Korean to English`
  );
  applyTextCommandCallback(ctx, 'koen', false, (msg, cmd, argstr) => {
    if (!argstr) return tgSendHelp(ctx, msg, cmd);
    log.iH([cmd], argstr);
    ctx.bot.sendMessage(msg.chat.id, enkoConverter(false, argstr), {
      reply_to_message_id: msg.message_id,
    });
  });

  // Korean to English (한영) command - Korean command alias
  ctx.registerHelpMsg('한영',
    `\`/한영@${ctx.botId} [text]\`\n\\- Alias of \\/koen`
  );
  applyTextCommandCallback(ctx, '한영', false, (msg, cmd, argstr) => {
    if (!argstr) return tgSendHelp(ctx, msg, cmd);
    log.iH([cmd], argstr);
    ctx.bot.sendMessage(msg.chat.id, enkoConverter(false, argstr), {
      reply_to_message_id: msg.message_id,
    });
  });
}
