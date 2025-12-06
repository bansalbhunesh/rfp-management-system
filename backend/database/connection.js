require('dotenv').config();

let db = null;
let dbType = null;

// Determine which database to use
if (process.env.DB_NAME && process.env.DB_USER) {
  // Use PostgreSQL - only require when needed
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
  // Use SQLite fallback - only require when needed
  dbType = 'sqlite';
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    console.error('❌ better-sqlite3 not installed. Run: npm install better-sqlite3');
    throw err;
  }
  
  const path = require('path');
  const fs = require('fs');

  // Ensure db directory exists
  const dbDir = path.join(__dirname, '..', 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'local.sqlite');
  let sqliteDb;
  
  try {
    sqliteDb = new Database(dbPath);
    console.log('📦 Using SQLite database');
    console.log(`   Database file: ${dbPath}`);
  } catch (err) {
    console.error('❌ Failed to open SQLite database:', err.message);
    throw err;
  }

  // Initialize schema if needed (only if tables don't exist)
  try {
    const tableCheck = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='vendors'").get();
    if (!tableCheck) {
      const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        sqliteDb.exec(schema);
        console.log('✅ SQLite schema initialized');
      }
    } else {
      console.log('✅ SQLite database ready');
    }
  } catch (err) {
    console.error('⚠️  Schema initialization warning:', err.message);
  }

  // Convert PostgreSQL placeholders ($1, $2, etc.) to SQLite placeholders (?)
  function convertPostgresToSQLite(sql, params) {
    // Count how many NOW() functions are in the SQL (they don't need parameters)
    const nowMatches = sql.match(/NOW\(\)/gi);
    const nowCount = nowMatches ? nowMatches.length : 0;
    
    // Replace PostgreSQL functions with SQLite equivalents
    let sqliteSql = sql
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/\bCURRENT_TIMESTAMP\b/gi, "datetime('now')");
    
    // Replace $1, $2, etc. with ? in order
    // We need to preserve the order and map correctly
    const placeholderMatches = sql.match(/\$\d+/g) || [];
    const maxPlaceholder = placeholderMatches.length > 0 
      ? Math.max(...placeholderMatches.map(m => parseInt(m.substring(1))))
      : 0;
    
    // Replace placeholders in reverse order to avoid conflicts
    for (let i = maxPlaceholder; i >= 1; i--) {
      sqliteSql = sqliteSql.replace(new RegExp(`\\$${i}`, 'g'), '?');
    }
    
    // Handle RETURNING clause (SQLite doesn't support it in all contexts)
    const returningMatch = sql.match(/INSERT\s+INTO\s+(\w+).*?RETURNING\s+\*/i);
    let hasReturning = false;
    let tableName = null;
    
    if (returningMatch) {
      hasReturning = true;
      tableName = returningMatch[1];
      sqliteSql = sqliteSql.replace(/\s+RETURNING\s+\*/i, '');
    }
    
    return { sql: sqliteSql, hasReturning, tableName, params };
  }

  db = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        try {
          const { sql: sqliteSql, hasReturning, tableName, params: convertedParams } = convertPostgresToSQLite(sql, params);
          
          if (hasReturning) {
            // Execute INSERT and get the inserted row
            const stmt = sqliteDb.prepare(sqliteSql);
            const info = stmt.run(convertedParams);
            
            // Get the inserted row
            const insertedRow = sqliteDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(info.lastInsertRowid);
            
            resolve({ rows: insertedRow ? [insertedRow] : [] });
          } else if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
            // SELECT queries
            const stmt = sqliteDb.prepare(sqliteSql);
            const rows = stmt.all(convertedParams);
            resolve({ rows });
          } else {
            // Other queries (UPDATE, DELETE, etc.)
            const returningMatch = sql.match(/UPDATE\s+\w+.*?RETURNING\s+\*/i);
            if (returningMatch) {
              // Handle UPDATE ... RETURNING *
              // Extract table name and WHERE clause
              const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
              const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+RETURNING|$)/i);
              
              if (updateMatch && whereMatch) {
                const tableName = updateMatch[1];
                // Remove RETURNING clause
                const updateSql = sqliteSql.replace(/\s+RETURNING\s+\*/i, '');
                const stmt = sqliteDb.prepare(updateSql);
                const info = stmt.run(convertedParams);
                
                if (info.changes > 0) {
                  // Get the updated row - we need the WHERE clause value (usually the last param)
                  // This is a simplified approach - assumes WHERE id = ?
                  const selectStmt = sqliteDb.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
                  const updatedRow = selectStmt.get(convertedParams[convertedParams.length - 1]);
                  resolve({ rows: updatedRow ? [updatedRow] : [] });
                } else {
                  resolve({ rows: [] });
                }
              } else {
                const stmt = sqliteDb.prepare(sqliteSql);
                const info = stmt.run(convertedParams);
                resolve({ rows: [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }] });
              }
            } else {
              const stmt = sqliteDb.prepare(sqliteSql);
              const info = stmt.run(convertedParams);
              resolve({ rows: [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }] });
            }
          }
        } catch (err) {
          reject(err);
        }
      });
    }
  };
}

module.exports = db;
