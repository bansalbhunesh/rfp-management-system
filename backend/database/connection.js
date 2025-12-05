require('dotenv').config();

let db = null;
let dbType = null;

// Determine which database to use
if (process.env.DB_NAME && process.env.DB_USER) {
  // Use PostgreSQL
  const { Pool } = require('pg');
  dbType = 'postgres';
  
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });

  // Test connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err.message);
      console.error('💡 Make sure PostgreSQL is running and database credentials are correct in .env file');
    } else {
      console.log('✅ PostgreSQL connected successfully');
    }
  });

  db = {
    query: (sql, params) => {
      return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve({ rows: result.rows });
          }
        });
      });
    }
  };
} else {
  // Use SQLite fallback
  dbType = 'sqlite';
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');

  // Ensure db directory exists
  const dbDir = path.join(__dirname, '..', 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'local.sqlite');
  const sqliteDb = new Database(dbPath);

  console.log('📦 Using SQLite database (local demo mode)');
  console.log(`   Database file: ${dbPath}`);

  // Initialize schema if needed
  const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    sqliteDb.exec(schema);
    console.log('✅ SQLite schema initialized');
  }

  db = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        try {
          // Handle INSERT ... RETURNING * for SQLite
          const returningMatch = sql.match(/INSERT\s+INTO\s+(\w+).*?RETURNING\s+\*/i);
          if (returningMatch) {
            const tableName = returningMatch[1];
            // Execute INSERT
            const stmt = sqliteDb.prepare(sql.replace(/\s+RETURNING\s+\*/i, ''));
            const info = stmt.run(params);
            
            // Get the inserted row
            const idColumn = tableName === 'rfps' || tableName === 'vendors' || 
                           tableName === 'proposals' || tableName === 'proposal_scores' ||
                           tableName === 'rfp_vendors' ? 'id' : 'id';
            const insertedRow = sqliteDb.prepare(`SELECT * FROM ${tableName} WHERE ${idColumn} = ?`).get(info.lastInsertRowid);
            
            resolve({ rows: insertedRow ? [insertedRow] : [] });
          } else if (sql.trim().toUpperCase().startsWith('SELECT')) {
            // SELECT queries
            const stmt = sqliteDb.prepare(sql);
            const rows = stmt.all(params);
            resolve({ rows });
          } else {
            // Other queries (UPDATE, DELETE, etc.)
            const stmt = sqliteDb.prepare(sql);
            const info = stmt.run(params);
            resolve({ rows: [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }] });
          }
        } catch (err) {
          reject(err);
        }
      });
    }
  };
}

module.exports = db;
