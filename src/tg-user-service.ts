import TelegramBot from 'node-telegram-bot-api';
import { z } from 'zod';
import { Logger } from '@/logger';
import { KyuSqlite3Database } from '@/database/base';
import { TGUserHistoryTable, TGUserSchema, TGUserTable } from '@/database/tg-user';
import { SimpleCache } from '@/utils/simple-cache';
import { getUserIdentifyName } from '@/utils/tg-macro';

const CACHE_SIZE = 1024;

const log = new Logger({
  parentHierarchy: ['tg-user'],
});

export class TGUserService {
  private tgUserTable: TGUserTable;
  private tgUserHistoryTable: TGUserHistoryTable;
  private cachedUsers = new SimpleCache<number, z.infer<typeof TGUserSchema>>(CACHE_SIZE);

  constructor(db: KyuSqlite3Database) {
    log.i('Initializing TGUserService');
    this.tgUserTable = TGUserTable.open(db);
    this.tgUserHistoryTable = TGUserHistoryTable.open(db);
  }

  getUser (userId: number): z.infer<typeof TGUserSchema> | undefined {
    log.t(['queryUserId'], userId);

    if (this.cachedUsers.has(userId)) {
      return this.cachedUsers.get(userId);
    }

    const user = this.tgUserTable.queryUserId(userId);
    if (user) {
      this.cachedUsers.set(userId, user);
    }
    return user;
  }

  getUserByIdentifyName (identifyName: string): z.infer<typeof TGUserSchema> | undefined {
    log.t(['queryIdentifyName'], identifyName);
    return this.tgUserTable.queryIdentifyName(identifyName);
  }

  /**
   * Update user information for Mention -> user_id finding
   */
  checkUser (user: TelegramBot.User): void {
    log.t(['checkUser'], user.id);

    // Check cache hit
    const cachedUser = this.getUser(user.id);
    if (
      cachedUser &&
      cachedUser.username == user.username &&
      cachedUser.first_name == user.first_name &&
      cachedUser.last_name == user.last_name &&
      cachedUser.language_code == user.language_code &&
      Boolean(cachedUser.is_bot) == user.is_bot
    ) {
      return;
    }

    // Cache miss, update cache
    const newUser = TGUserSchema.parse({
      user_id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      language_code: user.language_code,
      is_bot: user.is_bot ? 1 : 0,
      identify_name: getUserIdentifyName(user),
      detected_at: Date.now()
    });

    // If previous user info exists, add to history
    this.cachedUsers.set(user.id, newUser);
    if (cachedUser) {
      this.tgUserHistoryTable.create(cachedUser);
      this.tgUserTable.update(newUser);
    } else {
      this.tgUserTable.create(newUser);
    }
  }
}