const puppeteer = require('puppeteer');
const { db, initializeDatabase } = require('../database/db');

let browser;
let page;

(async () => {
    await initializeDatabase();
    browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
    });

    page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');

    console.log('⏳ Aguardando login... Escaneie o QR Code no WhatsApp Web.');

    await page.waitForFunction(() => {
        return document.querySelectorAll('span[dir="auto"][title]').length > 0;
    }, { timeout: 0 });

    console.log('✅ Login detectado!');

    async function saveContact(id, name) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO contacts (whatsapp_id, name) VALUES (?, ?)',
                [id, name],
                (err) => (err ? reject(err) : resolve())
            );
        });
    }

    async function saveMessage(contactId, sender, timestamp, message) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO messages (contact_id, sender, timestamp, message) VALUES (?, ?, ?, ?)',
                [contactId, sender, timestamp, message],
                (err) => (err ? reject(err) : resolve())
            );
        });
    }

    async function getContacts() {
        const contactElements = await page.$$(`span[dir="auto"][title]`);
        let contacts = [];
        for (const el of contactElements) {
            const name = await page.evaluate(el => el.getAttribute('title'), el);
            const id = name;
            contacts.push({ id, name });
        }
        return contacts;
    }

    async function openChatByName(name) {
        const found = await page.evaluate(async (contactName) => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
            const scrollContainer = document.querySelector('._ak72');
            if (!scrollContainer) return false;

            for (let i = 0; i < 10; i++) {
                const contactElements = Array.from(document.querySelectorAll('span[title]'));
                for (const el of contactElements) {
                    if (el.getAttribute('title') === contactName) {
                        el.click();
                        return true;
                    }
                }
                scrollContainer.scrollBy(0, 300);
                await delay(500);
            }

            return false;
        }, name);

        if (!found) {
            console.log(`❌ Contato "${name}" não encontrado.`);
            return false;
        } else {
            console.log(`➡️ Conversa com "${name}" aberta.`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            await page.evaluate(() => {
                const chatContainer = document.querySelector('div[data-testid="chat-history"]');
                if (chatContainer) {
                    chatContainer.scrollTop = 0;
                }
            });

            await new Promise(resolve => setTimeout(resolve, 3000));
            return true;
        }
    }

    async function getMessages() {
        return page.evaluate(() => {
            const messages = [];
            const containers = document.querySelectorAll('div.message-in, div.message-out');

            containers.forEach(container => {
                try {
                    const textSpan = container.querySelector('span.selectable-text span');
                    const text = textSpan ? textSpan.innerText.trim() : '';

                    const timeSpan =
                        container.querySelector('span.x1c4vz4f.x2lah0s') || 
                        container.querySelector('span.x1rg5ohu');          

                    const timestamp = timeSpan ? timeSpan.innerText.trim() : '';

                    const isSentByMe = container.classList.contains('message-out');
                    const sender = isSentByMe ? 'me' : 'other';

                    if (text) {
                        messages.push({ sender, timestamp, text });
                    }
                } catch (e) {
                    console.error('Erro ao processar mensagem:', e);
                }
            });

            return messages;
        });
    }

    const contacts = await getContacts();
    console.log(`🔍 Encontrados ${contacts.length} contatos.`);

    for (const contact of contacts) {
        console.log(`➡️ Abrindo conversa de: ${contact.name}`);
        const chatOpened = await openChatByName(contact.name);
        if (!chatOpened) continue;

        await new Promise(resolve => setTimeout(resolve, 3000));
        await saveContact(contact.id, contact.name);

        const messages = await getMessages();
        console.log(`💬 ${messages.length} mensagens em "${contact.name}".`);

        for (const msg of messages) {
            await saveMessage(contact.id, msg.sender, msg.timestamp, msg.text);
        }
    }

    console.log('✅ Varredura concluída.');

    async function sendMessageTo(name, message) {
        const opened = await openChatByName(name);
        if (!opened) return false;

        try {
            await page.waitForSelector('div[contenteditable="true"][data-tab]', { timeout: 5000 });
            const inputBox = await page.$('div[contenteditable="true"][data-tab]');
            await inputBox.focus();
            await page.keyboard.type(message, { delay: 50 });
            await page.keyboard.press('Enter');
            console.log(`✅ Mensagem enviada para "${name}"`);
            return true;
        } catch (err) {
            console.error(`❌ Erro ao enviar mensagem para "${name}":`, err.message);
            return false;
        }
    }

    async function processPendingMessages() {
        db.all(`
            SELECT m.id, m.message, c.name AS contact_name
            FROM messages m
            JOIN contacts c ON m.contact_id = c.id
            WHERE m.sender = 'me' AND m.sent = 0
            ORDER BY m.timestamp ASC
        `, async (err, rows) => {
            if (err) {
                console.error('Erro ao buscar mensagens pendentes:', err);
                return;
            }

            for (const msg of rows) {
                console.log(`➡️ Enviando mensagem pendente para ${msg.contact_name}...`);
                const success = await sendMessageTo(msg.contact_name, msg.message);
                if (success) {
                    db.run(`UPDATE messages SET sent = 1 WHERE id = ?`, [msg.id]);
                }
                await new Promise(r => setTimeout(r, 3000));
            }
        });
    }

    setInterval(processPendingMessages, 10000);

})();
