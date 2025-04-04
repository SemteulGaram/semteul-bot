import { translate as freeGoogleTranslateApi } from '@vitalets/google-translate-api';
import { KyushBot } from '@/kyushbot';
import { Logger } from '@/logger';
import { applyTextCommandCallback } from '@/command-util';
import { tgReplyText, tgSendHelp, tgUnhandleError } from '@/utils/tg-macro';

const log = new Logger({
  parentHierarchy: ['cmd', 'translate-google-free'],
});

function applyTranslateGoogleFree(
  ctx: KyushBot,
  cmd: string,
  to: string,
): void {
  log.info(`Applying Google Free Translate commands (cmd: ${cmd}, destLang: ${to})`);

  // Direct translate command with text
  applyTextCommandCallback(ctx, cmd, false, async (msg, cmd, argstr): Promise<void> => {
    try {
      let replyId: number | undefined;
      let targetText: string | undefined;
      
      if (!argstr) {
        // If no argument is provided, check if it's a reply
        if (msg.reply_to_message) {
          replyId = msg.reply_to_message.message_id;
          targetText = msg.reply_to_message.text;
          if (!targetText) return tgReplyText(ctx.bot, msg, 'Only text messages can be translated');
        } else {
          // No argument and no reply, show usage
          return tgSendHelp(ctx, msg, cmd);
        }
      } else {
        replyId = msg.message_id;
        targetText = String(argstr);
      }

      const text = (await freeGoogleTranslateApi(targetText, { to })).text;
      log.iH([cmd], `Translated: ${targetText} -> ${text}`);
      tgReplyText(ctx.bot, msg, text, { reply_to_message_id: replyId });
    } catch (unhandledErr) {
      tgUnhandleError(ctx, msg, cmd, unhandledErr, log);
    }
  });
}

export function applyBotCommandTranslateGoogleFree(
  ctx: KyushBot,
): void {
  log.i('Applying Google Free Translate commands');
  
  ctx.registerHelpMsg('gfen',
    `\`/gfen@${ctx.botId} [text]\`\n\\- Translate to English using Google Translate`
  );
  applyTranslateGoogleFree(ctx, 'gfen', 'en');
  ctx.registerHelpMsg('gfko',
    `\`/gfko@${ctx.botId} [text]\`\n\\- Translate to Korean using Google Translate`
  );
  applyTranslateGoogleFree(ctx, 'gfko', 'ko');
  ctx.registerHelpMsg('gfes',
    `\`/gfes@${ctx.botId} [text]\`\n\\- Translate to Spanish using Google Translate`
  );
  applyTranslateGoogleFree(ctx, 'gfes', 'es');
  ctx.registerHelpMsg('gfja',
    `\`/gfja@${ctx.botId} [text]\`\n\\- Translate to Japanese using Google Translate`
  );
  applyTranslateGoogleFree(ctx, 'gfja', 'ja');
}