import { z } from 'zod';
import { Logger } from '@/logger';
import { KyuSqlite3BaseTable, KyuSqlite3Database } from './base';
import { RateLimitRuleList, RateLimitRuleListType } from '@/types/rate-limit';

const log = new Logger({
  parentHierarchy: ['db', 'rate-limit'],
});

/*
 * Table: rate_limit_log
 * - id: INTEGER AUTOINCREMENT
 * - user_id: INTEGER
 * - chat_id: INTEGER
 * - command: TEXT
 * - issue_at: INTEGER
 * PRIMARY KEY (id)
 */
export const RateLimitLogSchema = z.object({
  id: z.number().int().optional(),
  user_id: z.number().int(),
  chat_id: z.number().int(),
  command: z.string(),
  issue_at: z.number().int().min(0),
});
export class RateLimitLogTable extends KyuSqlite3BaseTable {
  static open (
    ks3db: KyuSqlite3Database,
  ): RateLimitLogTable {
    const table = KyuSqlite3BaseTable._open<RateLimitLogTable>(
      ks3db,
      'rate_limit_log',
      RateLimitLogTable,
    );
    table.init();
    return table;
  }

  init (): void {
    this.ks3db.db.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chat_id INTEGER NOT NULL,
        command TEXT NOT NULL,
        issue_at INTEGER NOT NULL
      )`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_user_id ON ${this.tableName} (user_id)`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_chat_id ON ${this.tableName} (chat_id)`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_command ON ${this.tableName} (command)`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_issue_at ON ${this.tableName} (issue_at)`
    );
  }

  create (entity: z.infer<typeof RateLimitLogSchema>): boolean {
    try {
      this.ks3db.db.prepare(
        `INSERT INTO ${this.tableName} (user_id, chat_id, command, issue_at) VALUES (?, ?, ?, ?)`
      ).run(
        entity.user_id,
        entity.chat_id,
        entity.command,
        entity.issue_at
      );
      return true;
    } catch (err) {
      log.eH(['create'], err);
      return false;
    }
  }

  queryUserCommandCount (
    userId: number,
    command: string,
    afterAt: number,
  ): number {
    const result = this.ks3db.db.prepare(
      `SELECT COUNT(*) FROM ${this.tableName} WHERE user_id = ? AND command = ? AND issue_at >= ?`
    ).get(userId, command, afterAt) as any;
    return Number(result['COUNT(*)']);
  }

  queryChatCommandCount (
    chatId: number,
    command: string,
    afterAt: number,
  ): number {
    const result = this.ks3db.db.prepare(
      `SELECT COUNT(*) FROM ${this.tableName} WHERE chat_id = ? AND command = ? AND issue_at >= ?`
    ).get(chatId, command, afterAt) as any;
    return Number(result['COUNT(*)']);
  }

  queryCommandCount (
    command: string,
    afterAt: number,
  ): number {
    const result = this.ks3db.db.prepare(
      `SELECT COUNT(*) FROM ${this.tableName} WHERE command = ? AND issue_at >= ?`
    ).get(command, afterAt) as any;
    return Number(result['COUNT(*)']);
  }
}

/*
 * Table: rate_limit_rule
 * - command: TEXT
 * - list_type: TEXT
 * - value: INTEGER (0 when command)
 * - limit_count: INTEGER
 * - period: INTEGER
 * PRIMARY KEY (command, list_type, value)
 */
export const RateLimitRuleSchema = z.object({
  command: z.string(),
  list_type: z.enum(RateLimitRuleList),
  value: z.number(),
  limit_count: z.number().int().min(1),
  period: z.number().int().min(1),
});
export class RateLimitRuleTable extends KyuSqlite3BaseTable {
  static open (
    ks3db: KyuSqlite3Database,
  ): RateLimitRuleTable {
    const table = KyuSqlite3BaseTable._open<RateLimitRuleTable>(
      ks3db,
      'rate_limit_rule',
      RateLimitRuleTable,
    );
    table.init();
    return table;
  }
  
  // override
  init (): void {
    this.ks3db.db.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        command TEXT NOT NULL,
        list_type TEXT NOT NULL,
        value INTEGER NOT NULL,
        limit_count INTEGER NOT NULL,
        period INTEGER NOT NULL,
        PRIMARY KEY (command, list_type, value)
      )`
    );
  }

  create (entity: z.infer<typeof RateLimitRuleSchema>): boolean {
    try {
      this.ks3db.db.prepare(
        `INSERT INTO ${this.tableName} (command, list_type, value, limit_count, period) VALUES (?, ?, ?, ?, ?)`
      ).run(
        entity.command,
        entity.list_type,
        entity.value,
        entity.limit_count,
        entity.period
      );
      return true;
    } catch (err) {
      log.eH(['create'], err);
      return false;
    }
  }

  queryRule (command: string, listType: RateLimitRuleListType, value: number): z.infer<typeof RateLimitRuleSchema> | null {
    try {
      return this.ks3db.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE command = ? AND list_type = ? AND value = ?`
      ).get(command, listType, value) as z.infer<typeof RateLimitRuleSchema> | null;
    } catch (err) {
      log.eH(['queryRule'], err);
      return null;
    }
  }

  queryAll (): z.infer<typeof RateLimitRuleSchema>[] {
    try {
      return this.ks3db.db.prepare(
        `SELECT * FROM ${this.tableName}`
      ).all() as z.infer<typeof RateLimitRuleSchema>[];
    } catch (err) {
      log.eH(['queryAll'], err);
      return [];
    }
  }

  update (entity: z.infer<typeof RateLimitRuleSchema>): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `UPDATE ${this.tableName} SET limit_count = ?, period = ? WHERE command = ? AND list_type = ? AND value = ?`
      ).run(
        entity.limit_count,
        entity.period,
        entity.command,
        entity.list_type,
        entity.value
      );
      return result.changes > 0;
    } catch (err) {
      log.eH(['update'], err);
      return false;
    }
  }

  remove (command: string, listType: RateLimitRuleListType, value: number): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `DELETE FROM ${this.tableName} WHERE command = ? AND list_type = ? AND value = ?`
      ).run(command, listType, value);
      return result.changes > 0;
    } catch (err) {
      log.eH(['remove'], err);
      return false;
    }
  }
}