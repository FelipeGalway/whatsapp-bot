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

    await page.waitForSelector('div[aria-label="Lista de conversas"]', { timeout: 0 });
    console.log('✅ Login detectado!');

    async function saveContact(id, name) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO contacts (id, name) VALUES (?, ?)',
                [id, name],
                (err) => (err ? reject(err) : resolve())
            );
        });
    }

    async function saveMessage(contactId, sender, time, text) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO messages (contact_id, sender, time, text) VALUES (?, ?, ?, ?)',
                [contactId, sender, time, text],
                (err) => (err ? reject(err) : resolve())
            );
        });
    }

    async function getContacts() {
        // Seletores atualizados (valide no seu WhatsApp Web)
        const contactElements = await page.$$('._2wP_Y');

        let contacts = [];
        for (const contactEl of contactElements) {
            const nameHandle = await contactEl.$('._3CneP span[dir="auto"]');
            const name = nameHandle ? await page.evaluate(el => el.innerText, nameHandle) : 'Sem nome';
            console.log('Contato encontrado:', name);
            const id = name;
            contacts.push({ id, name });
        }
        return contacts;
    }


    async function getMessages() {
        const messageElements = await page.$$('div[role="region"] div[role="row"]');

        let messages = [];

        for (const messageEl of messageElements) {
            const textEl = await messageEl.$('span.selectable-text span');
            const text = textEl ? await page.evaluate(el => el.innerText, textEl) : '';

            const timeEl = await messageEl.$('span[data-testid="msg-time"]');
            const time = timeEl ? await page.evaluate(el => el.innerText, timeEl) : '';

            const classes = await page.evaluate(el => el.className, messageEl);
            const sender = classes.includes('message-out') ? 'me' : 'other';

            if (text) {
                messages.push({ sender, time, text });
            }
        }
        return messages;
    }

    const contacts = await getContacts();
    console.log(`🔍 Encontrados ${contacts.length} contatos.`);

    for (const contact of contacts) {
        console.log(`➡️ Abrindo conversa de: ${contact.name}`);

        await page.evaluate((name) => {
            const contactRow = Array.from(document.querySelectorAll('div[role="gridcell"] div[role="row"]'))
                .find(el => el.innerText.includes(name));
            if (contactRow) contactRow.click();
        }, contact.name);

        await page.waitForTimeout(2000);

        await saveContact(contact.id, contact.name);

        const messages = await getMessages();

        console.log(`💬 Encontradas ${messages.length} mensagens em "${contact.name}".`);

        for (const msg of messages) {
            await saveMessage(contact.id, msg.sender, msg.time, msg.text);
        }
    }

    console.log('✅ Varredura concluída.');
    // await browser.close();
})();
