const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initializeDatabase } = require('../database/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

(async () => {
  try {
    await initializeDatabase();
    console.log('Banco inicializado com sucesso.');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
    process.exit(1);
  }
})();

app.post('/send-message', (req, res) => {
  const { contactId, message } = req.body;

  db.run(
    'INSERT INTO messages (contact_id, sender, message, timestamp) VALUES (?, ?, ?, ?)',
    [contactId, 'me', message, new Date().toISOString()],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, messageId: this.lastID });
    }
  );
});

app.get('/contacts', (req, res) => {
  db.all('SELECT * FROM contacts', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/messages/:contactId', (req, res) => {
  const contactId = req.params.contactId;
  db.all(
    'SELECT * FROM messages WHERE contact_id = ? ORDER BY timestamp ASC',
    [contactId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
