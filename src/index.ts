import fs from 'node:fs';
import 'dotenv-defaults/config';
import { Logger, LogLevel } from '@/logger';
import { KyushBot } from '@/kyushbot';

if (String(process.env.NODE_ENV).toLowerCase() === 'development') {
  Logger.globalLogLevel = LogLevel.TRACE;
}

// Ensure ./data directory exists
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data');
}

// Initialize the bot
KyushBot.getInstance();
