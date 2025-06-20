const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cria/abre o arquivo do banco localmente
const dbPath = path.resolve(__dirname, 'whatsapp.db');
const db = new sqlite3.Database(dbPath);

// Criar tabelas se não existirem
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
      FOREIGN KEY(contact_id) REFERENCES contacts(id)
    )
  `);
});

module.exports = db;
