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

    // Aguarda até os contatos aparecerem 
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
            console.log(`❌ Contato "${name}" não encontrado ou não clicável.`);
            return false;
        } else {
            console.log(`➡️ Conversa com "${name}" aberta.`);
            // Espera o carregamento da conversa
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Scroll para o topo do chat para carregar mensagens antigas
            await page.evaluate(() => {
                const chatContainer = document.querySelector('div[data-testid="chat-history"]');
                if (chatContainer) {
                    chatContainer.scrollTop = 0;
                }
            });
            // Espera mensagens antigas carregarem
            await new Promise(resolve => setTimeout(resolve, 3000));

            return true;
        }
    }

    async function getMessages() {
        return page.evaluate(() => {
            const messages = [];
            const msgContainers = Array.from(document.querySelectorAll(
                'div[data-pre-plain-text], ' +
                'div[data-id^="false_"]'
            ));

            msgContainers.forEach(container => {
                try {
                    const rawMetadata = container.getAttribute('data-pre-plain-text') || '';

                    let sender = 'unknown';
                    let timestamp = '';

                    if (rawMetadata.includes('Você')) {
                        sender = 'me';
                    } else if (rawMetadata.includes(']')) {
                        sender = rawMetadata.split('] ')[1]?.trim() || 'unknown';
                    }

                    const timeMatch = rawMetadata.match(/\[(\d{1,2}:\d{1,2}(?::\d{1,2})?)\]/);
                    timestamp = timeMatch ? timeMatch[1] : '';

                    let text = '';

                    const textSpan = container.querySelector('span.selectable-text.copyable-text');
                    if (textSpan) {
                        text = textSpan.innerText;
                    }

                    else {
                        const textDiv = container.querySelector('div.copyable-text');
                        if (textDiv) {
                            text = textDiv.innerText;
                        }
                    }

                    if (text || rawMetadata.includes('mídia ocultada')) {
                        messages.push({
                            sender,
                            timestamp,
                            text: text || '[mídia]',
                            raw: rawMetadata
                        });
                    }
                } catch (e) {
                    console.error('Erro ao processar mensagem:', e);
                }
            });

            return messages;
        });
    }

    // Início da varredura    
    const contacts = await getContacts();
    console.log(`🔍 Encontrados ${contacts.length} contatos.`);

    for (const contact of contacts) {
        console.log(`➡️ Abrindo conversa de: ${contact.name}`);

        const chatOpened = await openChatByName(contact.name);
        if (!chatOpened) continue; // pula se não encontrou contato

        await new Promise(resolve => setTimeout(resolve, 3000));

        await saveContact(contact.id, contact.name);

        const messages = await getMessages();
        console.log(`💬 Encontradas ${messages.length} mensagens em "${contact.name}".`);

        for (const msg of messages) {
            await saveMessage(contact.id, msg.sender, msg.timestamp, msg.text);
        }
    }

    console.log('✅ Varredura concluída.');

})();