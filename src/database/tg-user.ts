import { z } from 'zod';
import { Logger } from '@/logger';
import { KyuSqlite3BaseTable, KyuSqlite3Database } from './base';

const log = new Logger({
  parentHierarchy: ['db', 'tg-user'],
});

/*
 * Table: tg_user
 * - user_id: INTEGER
 * - username: TEXT
 * - first_name: TEXT
 * - last_name: TEXT
 * - language_code: TEXT
 * - is_bot: INTEGER
 * - identify_name: TEXT
 * - detected_at: INTEGER
 * PRIMARY KEY (user_id)
 */
export const TGUserSchema = z.object({
  user_id: z.number().int(),
  username: z.string().optional(),
  first_name: z.string(),
  last_name: z.string().optional(),
  language_code: z.string().optional(),
  is_bot: z.number().int().min(0).max(1),
  identify_name: z.string(),
  detected_at: z.number().int().min(0),
});
export class TGUserHistoryTable extends KyuSqlite3BaseTable {
  static open (
    ks3db: KyuSqlite3Database,
  ): TGUserHistoryTable {
    const table = KyuSqlite3BaseTable._open<TGUserHistoryTable>(
      ks3db,
      'tg_user_history',
      TGUserHistoryTable,
    );
    table.init();
    return table;
  }
  
  // override
  init (): void {
    this.ks3db.db.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        user_id INTEGER NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT,
        is_bot INTEGER,
        identify_name TEXT NOT NULL,
        detected_at INTEGER,
        PRIMARY KEY (user_id, detected_at)
      )`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_user_id ON ${this.tableName} (user_id)`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_identify_name ON ${this.tableName} (identify_name)`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_detected_at ON ${this.tableName} (detected_at)`
    );
  }

  create (entity: z.infer<typeof TGUserSchema>): boolean {
    try {
      log.tH(['history', 'create'], entity);
      this.ks3db.db.prepare(
        `INSERT INTO ${this.tableName} (user_id, username, first_name, last_name, language_code, is_bot, identify_name, detected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        entity.user_id,
        entity.username,
        entity.first_name,
        entity.last_name,
        entity.language_code,
        entity.is_bot,
        entity.identify_name,
        entity.detected_at
      );
      return true;
    } catch (err) {
      log.eH(['history', 'create'], err);
      return false;
    }
  }

  queryUserId (userId: number): z.infer<typeof TGUserSchema>[] {
    log.tH(['history', 'queryUserId'], userId);
    return this.ks3db.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY detected_at DESC`
    ).all(userId) as z.infer<typeof TGUserSchema>[];
  }

  queryIdentifyName (identifyName: string): z.infer<typeof TGUserSchema>[] {
    log.tH(['history', 'queryIdentifyName'], identifyName);
    return this.ks3db.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE identify_name = ? ORDER BY detected_at DESC`
    ).all(identifyName) as z.infer<typeof TGUserSchema>[];
  }

  remove (userId: number, detectedAt: number): boolean {
    log.tH(['history', 'remove'], userId, detectedAt);
    const result = this.ks3db.db.prepare(
      `DELETE FROM ${this.tableName} WHERE user_id = ? AND detected_at = ?`
    ).run(userId, detectedAt);
    return result.changes > 0;
  }

  removeUserId (userId: number): boolean {
    log.tH(['history', 'removeUserId'], userId);
    const result = this.ks3db.db.prepare(
      `DELETE FROM ${this.tableName} WHERE user_id = ?`
    ).run(userId);
    return result.changes > 0;
  }
}
export class TGUserTable extends KyuSqlite3BaseTable {
  static open (
    ks3db: KyuSqlite3Database,
  ): TGUserTable {
    const table = KyuSqlite3BaseTable._open<TGUserTable>(
      ks3db,
      'tg_user',
      TGUserTable,
    );
    table.init();
    return table;
  }
  
  // override
  init (): void {
    this.ks3db.db.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        user_id INTEGER NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT,
        is_bot INTEGER,
        identify_name TEXT NOT NULL,
        detected_at INTEGER,
        PRIMARY KEY (user_id)
      )`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_identify_name ON ${this.tableName} (identify_name)`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_detected_at ON ${this.tableName} (detected_at)`
    );
  }
  
  create (entity: z.infer<typeof TGUserSchema>): boolean {
    log.tH(['create'], entity);
    try {
      this.ks3db.db.prepare(
        `INSERT INTO ${this.tableName} (user_id, username, first_name, last_name, language_code, is_bot, identify_name, detected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        entity.user_id,
        entity.username,
        entity.first_name,
        entity.last_name,
        entity.language_code,
        entity.is_bot,
        entity.identify_name,
        entity.detected_at
      );
      return true;
    } catch (err) {
      log.eH(['create'], err);
      return false;
    }
  }

  queryUserId (userId: number): z.infer<typeof TGUserSchema> | undefined {
    log.tH(['queryUserId'], userId);
    return this.ks3db.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE user_id = ?`
    ).get(userId) as z.infer<typeof TGUserSchema> | undefined;
  }

  queryIdentifyName (identifyName: string): z.infer<typeof TGUserSchema> | undefined {
    log.tH(['queryIdentifyName'], identifyName);
    return this.ks3db.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE identify_name = ?`
    ).get(identifyName) as z.infer<typeof TGUserSchema> | undefined;
  }

  update (entity: z.infer<typeof TGUserSchema>): boolean {
    log.tH(['update'], entity);
    try {
      this.ks3db.db.prepare(
        `UPDATE ${this.tableName} SET username = ?, first_name = ?, last_name = ?, language_code = ?, is_bot = ?, identify_name = ?, detected_at = ? WHERE user_id = ?`
      ).run(
        entity.username,
        entity.first_name,
        entity.last_name,
        entity.language_code,
        entity.is_bot,
        entity.identify_name,
        entity.detected_at,
        entity.user_id
      );
      return true;
    } catch (err) {
      log.eH(['update'], err);
      return false;
    }
  }

  remove (userId: number): boolean {
    log.tH(['remove'], userId);
    const result = this.ks3db.db.prepare(
      `DELETE FROM ${this.tableName} WHERE user_id = ?`
    ).run(userId);
    return result.changes > 0;
  }
}