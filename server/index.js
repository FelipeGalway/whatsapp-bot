const express = require('express');
const db = require('../database/db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-message', (req, res) => {
  const { contactId, message } = req.body;

  console.log(`Mensagem para ${contactId}: ${message}`);

  // Simulando o salvamento no banco
  db.run(
    'INSERT INTO messages (contact_id, sender, message, timestamp) VALUES (?, ?, ?, ?)',
    [contactId, 'me', message, new Date().toLocaleTimeString()],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, messageId: this.lastID });
    }
  );
});

// Retornar lista de contatos
app.get('/contacts', (req, res) => {
  db.all('SELECT * FROM contacts', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Retornar mensagens de um contato
app.get('/messages/:contactId', (req, res) => {
  const contactId = req.params.contactId;
  db.all(
    'SELECT * FROM messages WHERE contact_id = ? ORDER BY timestamp ASC',
    [contactId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
