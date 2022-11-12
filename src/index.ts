import 'dotenv-defaults/config';

import { defaultLogger as log, Logger, LogLevel } from './logger';

Logger.globalLogLevel = LogLevel.TRACE;

// https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = 'true';
import('./telegram/index')
  .then(() => {
    log.info('Telegram bot started');
  })
  .catch(log.error.bind(log));
