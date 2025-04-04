import { KyuSqlite3BaseTable, KyuSqlite3Database } from '@/database/base';

/*
 * Table: live_translate
 * - roomid: TEXT
 * - userid: TEXT
 * - engine: TEXT
 * - targetlang: TEXT
 */
export class LiveTranslateEntity {
  roomid!: string;
  userid!: string;
  engine!: string;
  targetlang!: string;
}
export class LiveTranslateTable extends KyuSqlite3BaseTable {
  static open(
    ks3db: KyuSqlite3Database,
  ): LiveTranslateTable {
    const table = KyuSqlite3BaseTable._open<LiveTranslateTable>(
      ks3db,
      'live_translate',
      LiveTranslateTable,
    );
    table.init();
    return table;
  }

  // override
  init(): void {
    this.ks3db.db.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        roomid TEXT,
        userid TEXT,
        engine TEXT,
        targetlang TEXT,
        PRIMARY KEY (roomid, userid)
      )`
    );
    this.ks3db.db.exec(
      `CREATE INDEX IF NOT EXISTS ${this.tableName}_roomid_userid ON ${this.tableName} (roomid, userid)`
    );
  }

  create(ent: LiveTranslateEntity): void {
    this.ks3db.db.prepare(
      `INSERT INTO ${this.tableName} VALUES (?, ?, ?, ?)`
    ).run(ent.roomid, ent.userid, ent.engine, ent.targetlang);
  }

  query(
    roomid: string,
    userid: string,
  ): LiveTranslateEntity | undefined {
    return this.ks3db.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE roomid = ? AND userid = ?`
    ).get(roomid, userid) as LiveTranslateEntity | undefined;
  }

  remove(roomid: string, userid: string): boolean {
    const result = this.ks3db.db.prepare(
      `DELETE FROM ${this.tableName} WHERE roomid = ? AND userid = ?`
    ).run(roomid, userid);
    return result.changes > 0;
  }
}