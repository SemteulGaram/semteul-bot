import { KyuSqlite3BaseTable, KyuSqlite3Database } from './base';
import { AclListType } from '@/types/acl';
import { Logger } from '@/logger';

const dblog = new Logger({
  parentHierarchy: ['db', 'acl'],
});

/*
 * Table: command_acl
 * - command: TEXT (PRIMARY KEY)
 * - default_allow: INTEGER (0 or 1)
 * - deny_message: TEXT
 */
export class CommandACLEntity {
  command!: string;
  default_allow!: number;
  deny_message?: string;
}
export class CommandACLTable extends KyuSqlite3BaseTable {
  static open (
    ks3db: KyuSqlite3Database,
  ): CommandACLTable {
    const table = KyuSqlite3BaseTable._open<CommandACLTable>(
      ks3db,
      'command_acl',
      CommandACLTable,
    );
    table.init();
    return table;
  }
  
  // override
  init (): void {
    this.ks3db.db.exec(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        command TEXT PRIMARY KEY,
        default_allow INTEGER DEFAULT 0,
        deny_message TEXT
      )`
    );
  }
  
  create (command: string, defaultAllow: boolean, denyMessage?: string): boolean {
    try {
      this.ks3db.db.prepare(
        `INSERT INTO ${this.tableName} (command, default_allow, deny_message) VALUES (?, ?, ?)`
      ).run(command, defaultAllow ? 1 : 0, denyMessage || null);
      return true;
    } catch (err) {
      dblog.eH(['create'], err);
      return false;
    }
  }
  
  update (command: string, defaultAllow: boolean, denyMessage?: string): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `UPDATE ${this.tableName} SET default_allow = ?, deny_message = ? WHERE command = ?`
      ).run(defaultAllow ? 1 : 0, denyMessage || null, command);
      return result.changes > 0;
    } catch (err) {
      dblog.e(err);
      return false;
    }
  }
  
  getAll (): CommandACLEntity[] {
    try {
      return this.ks3db.db.prepare(
        `SELECT * FROM ${this.tableName}`
      ).all() as CommandACLEntity[];
    } catch (err) {
      dblog.e(err);
      return [];
    }
  }
  
  get (command: string): CommandACLEntity | undefined {
    try {
      return this.ks3db.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE command = ?`
      ).get(command) as CommandACLEntity | undefined;
    } catch (err) {
      dblog.e(err);
      return undefined;
    }
  }
  
  remove (command: string): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `DELETE FROM ${this.tableName} WHERE command = ?`
      ).run(command);
      return result.changes > 0;
    } catch (err) {
      dblog.e(err);
      return false;
    }
  }
  }
  
/*
  * Table: acl_list
  * - command: TEXT
  * - list_type: TEXT
  *   - user_whitelist
  *   - user_blacklist
  *   - chat_whitelist
  *   - chat_blacklist
  *   - role_whitelist
  *   - role_blacklist
  * - value: TEXT
  * - reason: Optional TEXT
  * PRIMARY KEY (command, list_type, value)
  */
export class ACLListEntity {
  command!: string;
  list_type!: string;
  value!: string;
  reason?: string;
}
export class ACLListTable extends KyuSqlite3BaseTable {
  static open(
    ks3db: KyuSqlite3Database,
  ): ACLListTable {
    const table = KyuSqlite3BaseTable._open<ACLListTable>(
    ks3db,
    'acl_list',
    ACLListTable,
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
      value TEXT NOT NULL,
      reason TEXT,
      PRIMARY KEY (command, list_type, value)
    )`
    );
    this.ks3db.db.exec(
    `CREATE INDEX IF NOT EXISTS ${this.tableName}_command_list_type ON ${this.tableName} (command, list_type)`
    );
  }
  
  add (command: string, aclListType: AclListType, value: string, reason?: string): boolean {
    try {
      this.ks3db.db.prepare(
        `INSERT OR IGNORE INTO ${this.tableName} (command, list_type, value, reason) VALUES (?, ?, ?, ?)`
      ).run(command, aclListType, value, reason || null);
      return true;
    } catch (err) {
      dblog.error(err);
      return false;
    }
  }
  
  remove (command: string, aclListType: AclListType, value: string): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `DELETE FROM ${this.tableName} WHERE command = ? AND list_type = ? AND value = ?`
      ).run(command, aclListType, value);
      return result.changes > 0;
    } catch (err) {
      dblog.error(err);
      return false;
    }
  }

  get (command: string, aclListType: AclListType, value: string): ACLListEntity | undefined {
    try {
      return this.ks3db.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE command = ? AND list_type = ? AND value = ?`
      ).get(command, aclListType, value) as ACLListEntity | undefined;
    } catch (err) {
      dblog.error(err);
      return undefined;
    }
  }
  
  getList (command: string, aclListType: AclListType): string[] {
    try {
      const rows = this.ks3db.db.prepare(
        `SELECT value FROM ${this.tableName} WHERE command = ? AND list_type = ?`
      ).all(command, aclListType) as { value: string }[];
      return rows.map(row => row.value);
    } catch (err) {
      dblog.error(err);
      return [];
    }
  }
  
  getAllForCommand (command: string): ACLListEntity[] {
    try {
      return this.ks3db.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE command = ?`
      ).all(command) as ACLListEntity[];
    } catch (err) {
      dblog.error(err);
      return [];
    }
  }
}
  
  /*
   * Table: user_role
   * - user_id: TEXT
   * - role: TEXT
   * PRIMARY KEY (user_id, role)
   */
export class UserRoleEntity {
  user_id!: string;
  role!: string;
}
export class UserRoleTable extends KyuSqlite3BaseTable {
  static open (
    ks3db: KyuSqlite3Database,
  ): UserRoleTable {
    const table = KyuSqlite3BaseTable._open<UserRoleTable>(
    ks3db,
    'user_role',
    UserRoleTable,
    );
    table.init();
    return table;
  }
  
  // override
  init (): void {
    this.ks3db.db.exec(
    `CREATE TABLE IF NOT EXISTS ${this.tableName} (
      user_id TEXT,
      role TEXT,
      PRIMARY KEY (user_id, role)
    )`
    );
    this.ks3db.db.exec(
    `CREATE INDEX IF NOT EXISTS ${this.tableName}_user_id ON ${this.tableName} (user_id)`
    );
  }
  
  assign (userId: string, role: string): boolean {
    try {
      this.ks3db.db.prepare(
        `INSERT OR IGNORE INTO ${this.tableName} (user_id, role) VALUES (?, ?)`
      ).run(userId, role);
      return true;
    } catch (err) {
      dblog.error(err);
      return false;
    }
  }
  
  remove (userId: string, role: string): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `DELETE FROM ${this.tableName} WHERE user_id = ? AND role = ?`
      ).run(userId, role);
      return result.changes > 0;
    } catch (err) {
      dblog.error(err);
      return false;
    }
  }
  
  getRoles (userId: string): string[] {
    try {
      const rows = this.ks3db.db.prepare(
        `SELECT role FROM ${this.tableName} WHERE user_id = ?`
      ).all(userId) as { role: string }[];
      return rows.map(row => row.role);
    } catch (err) {
      dblog.error(err);
      return [];
    }
  }
  
  hasRole (userId: string, role: string): boolean {
    try {
      const result = this.ks3db.db.prepare(
        `SELECT 1 FROM ${this.tableName} WHERE user_id = ? AND role = ?`
      ).get(userId, role);
      return !!result;
    } catch (err) {
      dblog.error(err);
      return false;
    }
  }
  }