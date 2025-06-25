const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'whatsapp.db');
const db = new sqlite3.Database(dbPath);

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          whatsapp_id TEXT UNIQUE
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contact_id INTEGER,
          sender TEXT,
          message TEXT,
          timestamp TEXT,
          sent INTEGER DEFAULT 0,
          FOREIGN KEY(contact_id) REFERENCES contacts(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = { db, initializeDatabase };
