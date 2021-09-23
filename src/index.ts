import 'dotenv-defaults/config';

import { Logger } from './logger';

const log = new Logger('Root');

// https://github.com/yagop/node-telegram-bot-api/issues/319
process.env.NTBA_FIX_319 = 'true';
import('./telegram/index')
  .then(() => {
    log.info('Telegram bot started');
  })
  .catch(log.error);
