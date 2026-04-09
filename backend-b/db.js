const initSqlJs = require("sql.js");

let db = null;
let _autoId = { suppliers: 0, inventory: 0 };

async function getDb() {
  if (!db) {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    initSchema();
  }
  return db;
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id    INTEGER PRIMARY KEY,
      name  TEXT NOT NULL,
      city  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id            INTEGER PRIMARY KEY,
      supplier_id   INTEGER NOT NULL,
      product_name  TEXT    NOT NULL,
      quantity      INTEGER NOT NULL,
      price         REAL    NOT NULL,
      created_at    TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_supplier
      ON inventory(supplier_id);

    CREATE INDEX IF NOT EXISTS idx_inventory_value
      ON inventory(supplier_id, quantity, price);
  `);
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  const [{ id }] = query("SELECT last_insert_rowid() AS id");
  return { lastInsertRowid: id };
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, query, run, closeDb };
