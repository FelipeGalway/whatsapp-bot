let selectedContactId = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadContacts();
  } catch (error) {
    console.error('Erro inicial:', error);
    alert('Erro ao carregar contatos. Verifique o console.');
  }
});

// Carrega contatos
async function loadContacts() {
  const contactsDiv = document.getElementById('contacts');

  try {
    const res = await fetch('http://localhost:3000/contacts');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const contacts = await res.json();
    contactsDiv.innerHTML = '';

    if (contacts.length === 0) {
      contactsDiv.innerHTML = '<div class="no-contacts">Nenhum contato encontrado</div>';
      return;
    }

    contacts.forEach(contact => {
      const contactElement = document.createElement('div');
      contactElement.className = 'contact';
      contactElement.textContent = contact.name || contact.whatsapp_id;
      contactElement.onclick = () => {
        selectedContactId = contact.id;
        document.querySelectorAll('.contact').forEach(c => c.classList.remove('selected'));
        contactElement.classList.add('selected');
        loadMessages(contact.id);
      };
      contactsDiv.appendChild(contactElement);
    });

    if (contacts[0].id) {
      await loadMessages(contacts[0].id);
    }
  } catch (error) {
    console.error('Erro ao carregar contatos:', error);
    contactsDiv.innerHTML = '<div class="error">Erro ao carregar contatos</div>';
  }
}

// Carrega mensagens
async function loadMessages(contactId) {
  const messagesDiv = document.getElementById('messages');

  try {
    const res = await fetch(`http://localhost:3000/messages/${contactId}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const messages = await res.json();
    messagesDiv.innerHTML = '';

    messages.forEach(msg => {
      const msgElement = document.createElement('div');
      msgElement.className = 'message';
      msgElement.innerHTML = `
        <span class="sender">${msg.sender}:</span> 
        ${msg.message} 
        <div class="timestamp">${msg.timestamp}</div>
      `;
      messagesDiv.appendChild(msgElement);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    messagesDiv.innerHTML = '<div class="error">Erro ao carregar mensagens</div>';
  }
}

// Envia mensagem
document.getElementById('send-btn').onclick = async () => {
  const inputMessage = document.getElementById('input-message');
  const text = inputMessage.value.trim();

  if (!text || !selectedContactId) return;

  try {
    await fetch('http://localhost:3000/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: selectedContactId,
        message: text
      })
    });

    inputMessage.value = '';
    await loadMessages(selectedContactId);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
};
