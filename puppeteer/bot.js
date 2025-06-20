const puppeteer = require('puppeteer');
const db = require('../database/db');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
    });

    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');

    console.log('⏳ Aguardando login... Escaneie o QR Code no WhatsApp Web.');

    // Aguarda até os contatos aparecerem (ajustado para o seletor correto)
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
            const id = name; // Você pode usar o nome como ID, ou criar outra lógica
            contacts.push({ id, name });
        }
        return contacts;
    }

    async function openChatByName(name) {
        const found = await page.evaluate((contactName) => {
            const contacts = Array.from(document.querySelectorAll('span[dir="auto"][title]'));
            for (const el of contacts) {
                if (el.getAttribute('title') === contactName) {
                    const row = el.closest('div[role="row"]');
                    if (row) {
                        row.click();
                        return true;
                    } else {
                        return false;
                    }
                }
            }
            return false;
        }, name);

        if (!found) {
            console.log(`❌ Contato "${name}" não encontrado ou não clicável.`);
        } else {
            console.log(`➡️ Conversa com "${name}" aberta.`);
            await page.waitForTimeout(1500);
        }
    }

    async function getMessages() {
        // Seleciona todas as mensagens na conversa atual
        // Mensagens geralmente têm o atributo 'data-id' ou estão dentro de divs com role="row"
        const messageElements = await page.$$('div[role="row"]');

        let messages = [];

        for (const messageEl of messageElements) {
            // Busca o texto da mensagem
            const textEl = await messageEl.$('span[dir="ltr"] span.selectable-text span, span.selectable-text span');
            const text = textEl ? await page.evaluate(el => el.innerText, textEl) : '';

            // Busca o horário da mensagem
            const timeEl = await messageEl.$('span[data-testid="msg-time"], span[aria-label*="horário"]');
            const timestamp = timeEl ? await page.evaluate(el => el.innerText, timeEl) : '';

            // Determina quem enviou (baseado na classe)
            const className = await page.evaluate(el => el.className, messageEl);
            const sender = className.includes('message-out') ? 'me' : 'other';

            if (text) {
                messages.push({ sender, timestamp, text });
            }
        }
        return messages;
    }

    // Início da varredura
    const contacts = await getContacts();
    console.log(`🔍 Encontrados ${contacts.length} contatos.`);

    for (const contact of contacts) {
        console.log(`➡️ Abrindo conversa de: ${contact.name}`);

        await openChatByName(contact.name);
        await saveContact(contact.id, contact.name);

        const messages = await getMessages();
        console.log(`💬 Encontradas ${messages.length} mensagens em "${contact.name}".`);

        for (const msg of messages) {
            await saveMessage(contact.id, msg.sender, msg.timestamp, msg.text);
        }
    }

    console.log('✅ Varredura concluída.');
    // Se quiser fechar o navegador, descomente a linha abaixo
    // await browser.close();
})();
