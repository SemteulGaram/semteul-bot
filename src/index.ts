import 'dotenv/config';

import { Logger } from './logger';
import './bot';

const log = new Logger('Root');
import('./telegram/index').catch(log.error);
