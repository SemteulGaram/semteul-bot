import { applyTextCommandCallback } from '@/command-util';
import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';

const log = new Logger({
  parentHierarchy: ['cmd', 'help'],
});

export function applyBotCommandHelp(ctx: KyushBot): void {
  log.info('Applying help command (cmd: help)');

  ctx.registerHelpMsg('help',
    `\`/help@${ctx.botId}\`\n\\- Display this help message`
  );
  applyTextCommandCallback(ctx, 'help', true, (msg, _cmd, _argstr) => {
    const allowedHelp = ctx.getAllowedHelp(msg);
    if (allowedHelp) {
      ctx.bot.sendMessage(msg.chat.id, allowedHelp, { parse_mode: 'MarkdownV2', reply_to_message_id: msg.message_id });
    } else {
      ctx.bot.sendMessage(msg.chat.id, 'No commands are available', { reply_to_message_id: msg.message_id });
    }
  });
}