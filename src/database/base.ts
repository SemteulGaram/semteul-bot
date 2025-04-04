import Database from 'better-sqlite3';

export class KyuSqlite3Database {
  db: Database.Database;

  constructor() {
    throw new Error('Use .open() instead');
  }
  static open(filepath: string): KyuSqlite3Database {
    const db = new Database(filepath);
    const obj = Object.create(
      KyuSqlite3Database.prototype,
    ) as KyuSqlite3Database;
    obj.db = db;
    return obj;
  }

  static ensure_safe_key_string(key: string): string {
    // 입력값 검증
    if (!key || typeof key !== 'string') {
      throw new Error('Key must be a non-empty string');
    }
    
    // 모든 안전하지 않은 문자를 '_'로 치환 (전역 플래그 'g' 추가)
    let safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // 숫자로 시작하는 경우 접두사 추가 (SQLite 식별자 규칙)
    if (/^\d/.test(safeKey)) {
      safeKey = 'k_' + safeKey;
    }
    
    // SQL 예약어 체크
    const sqliteReservedWords = [
      'abort', 'action', 'add', 'after', 'all', 'alter', 'analyze', 'and', 'as', 'asc',
      'attach', 'autoincrement', 'before', 'begin', 'between', 'by', 'cascade', 'case',
      'cast', 'check', 'collate', 'column', 'commit', 'conflict', 'constraint', 'create',
      'cross', 'current_date', 'current_time', 'current_timestamp', 'database', 'default',
      'deferrable', 'deferred', 'delete', 'desc', 'detach', 'distinct', 'drop', 'each',
      'else', 'end', 'escape', 'except', 'exclusive', 'exists', 'explain', 'fail', 'for',
      'foreign', 'from', 'full', 'glob', 'group', 'having', 'if', 'ignore', 'immediate',
      'in', 'index', 'indexed', 'initially', 'inner', 'insert', 'instead', 'intersect',
      'into', 'is', 'isnull', 'join', 'key', 'left', 'like', 'limit', 'match', 'natural',
      'no', 'not', 'notnull', 'null', 'of', 'offset', 'on', 'or', 'order', 'outer', 'plan',
      'pragma', 'primary', 'query', 'raise', 'recursive', 'references', 'regexp', 'reindex',
      'release', 'rename', 'replace', 'restrict', 'right', 'rollback', 'row', 'savepoint',
      'select', 'set', 'table', 'temp', 'temporary', 'then', 'to', 'transaction', 'trigger',
      'union', 'unique', 'update', 'using', 'vacuum', 'values', 'view', 'virtual', 'when',
      'where', 'with', 'without'
    ];
    
    if (sqliteReservedWords.includes(safeKey.toLowerCase())) {
      safeKey = 'reserved_' + safeKey;
    }
    
    // 길이 제한 (SQLite는 일반적으로 문자열 길이 제한이 없지만, 관리 측면에서 제한 권장)
    const MAX_KEY_LENGTH = 64;
    if (safeKey.length > MAX_KEY_LENGTH) {
      safeKey = safeKey.substring(0, MAX_KEY_LENGTH);
    }
    
    return safeKey;
  }

  has_table(table_name: string): boolean {
    table_name = KyuSqlite3Database.ensure_safe_key_string(table_name);
    const result = this.db.prepare(
      'SELECT name FROM sqlite_master WHERE type="table" AND name=?'
    ).get(table_name);
    return !!result;
  }
}

export class KyuSqlite3BaseTable {
  private _tableName: string;
  ks3db: KyuSqlite3Database;

  constructor() {
    throw new Error(
      'Use .open() instead.',
    );
  }
  static _open<T extends KyuSqlite3BaseTable>(
    ks3db: KyuSqlite3Database,
    tableName: string,
    prototypeClass: { new (): KyuSqlite3BaseTable },
  ): T {
    const obj = Object.create(prototypeClass.prototype);
    obj.ks3db = ks3db;
    obj._tableName = KyuSqlite3Database.ensure_safe_key_string(tableName);
    return obj;
  }

  get tableName() {
    return this._tableName;
  }

  init(): void {
    throw new Error('Implement this methods.');
  }
}
