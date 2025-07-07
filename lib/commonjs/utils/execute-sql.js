"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeSql = executeSql;
const {
  sanitizeQueryResult
} = require('@nozbe/watermelondb/src/adapters/common');
const decodeQueryResult = require('@nozbe/watermelondb/src/adapters/sqlite/makeDispatcher/decodeQueryResult');
async function executeSql(database, sql, params = []) {
  console.log('[executeSql] Starting execution.');
  const isReadQuery = sql.trim().toLowerCase().startsWith('select');
  const sanitizedSql = sql.trim().replace(/;$/, '');
  let results;
  if (isReadQuery) {
    const tableNameMatch = sanitizedSql.match(/from\s+["']?(\w+)["']?/i);
    if (!tableNameMatch || !tableNameMatch[1]) {
      throw new Error('Could not parse table name from SELECT query.');
    }
    const tableName = tableNameMatch[1];
    console.log(`[executeSql] Parsed table name: ${tableName}`);
    const _db = database.adapter.underlyingAdapter._dispatcher._db;
    const isSelectAll = /select\s+\*\s+from/i.test(sanitizedSql);
    const isSelectCount = /select\s+count\(\*\)\s+from/i.test(sanitizedSql);
    if (isSelectAll) {
      console.log('[executeSql] Executing SELECT * query...');
      const rawResult = _db.queryAsArray(tableName, sanitizedSql, params);
      const decoded = decodeQueryResult.default(rawResult);
      const sanitized = sanitizeQueryResult(decoded, database.schema.tables[tableName]);
      const collection = database.collections.get(tableName);
      const modelInstances = collection._cache.recordsFromQueryResult(sanitized);
      const rows = modelInstances.map(model => model._raw);
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      results = {
        columns,
        rows
      };
    } else if (isSelectCount) {
      console.log('[executeSql] Executing COUNT(*) query with workaround...');
      const rewrittenSql = sanitizedSql.replace(/select.*from/i, 'SELECT * FROM');
      const rawResult = _db.queryAsArray(tableName, rewrittenSql, params);
      const decoded = decodeQueryResult.default(rawResult);
      const sanitized = sanitizeQueryResult(decoded, database.schema.tables[tableName]);
      const collection = database.collections.get(tableName);
      const modelInstances = collection._cache.recordsFromQueryResult(sanitized);
      const count = modelInstances.length;
      results = {
        columns: ['COUNT(*)'],
        rows: [{
          'COUNT(*)': count
        }]
      };
    } else {
      console.log('[executeSql] Executing partial SELECT via SELECT * workaround...');
      const columnMatch = sanitizedSql.match(/select\s+(.*?)\s+from/i);
      if (!columnMatch || !columnMatch[1]) {
        throw new Error('Could not parse columns from SELECT query.');
      }
      const requestedColumns = columnMatch[1].split(',').map(c => c.trim());
      const rewrittenSql = sanitizedSql.replace(/select\s+.*?\s+from/i, 'SELECT * FROM');
      console.log(`[executeSql] Rewritten query: ${rewrittenSql}`);
      const rawResult = _db.queryAsArray(tableName, rewrittenSql, params);
      const decoded = decodeQueryResult.default(rawResult);
      const sanitized = sanitizeQueryResult(decoded, database.schema.tables[tableName]);
      const collection = database.collections.get(tableName);
      const allModelInstances = collection._cache.recordsFromQueryResult(sanitized);
      const allRows = allModelInstances.map(model => model._raw);
      const filteredRows = allRows.map(row => {
        const newRow = {};
        requestedColumns.forEach(colName => {
          if (Object.prototype.hasOwnProperty.call(row, colName)) {
            newRow[colName] = row[colName];
          }
        });
        return newRow;
      });
      results = {
        columns: requestedColumns,
        rows: filteredRows
      };
    }
  } else {
    console.log('[executeSql] Detected write query.');
    await database.write(async () => {
      results = await database.adapter.unsafeExecute({
        sqls: [[sanitizedSql, params]]
      });
    });
  }
  console.log('[executeSql] Execution finished.');
  return results;
}
//# sourceMappingURL=execute-sql.js.map