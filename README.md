# 📱 WhatsApp Bot com Puppeteer e Interface Web

Este projeto é uma automação desenvolvida por **Felipe Ferreira**, utilizando **Node.js**, **Puppeteer**, **SQLite** e uma interface web simples. Ele interage com o **WhatsApp Web** de forma automatizada, com o objetivo de simular funcionalidades básicas do aplicativo: **capturar e exibir conversas**, além de **permitir o envio de mensagens** por meio de uma interface personalizada.

---

## 🚀 Funcionalidades

🔹**1. Automação com Puppeteer**

- Abre o navegador (modo visível) e acessa o WhatsApp Web.

- Aguarda o usuário escanear o QR Code e realizar login manualmente.

- Após o login, varre periodicamente os contatos listados na interface.

- Abre cada conversa, extrai mensagens (texto, horário e remetente).

- Armazena os dados coletados em um banco de dados local (SQLite).

🔹 **2. Interface Web**

- Lista todos os contatos disponíveis no banco de dados.

- Permite visualizar as conversas armazenadas com cada contato.

- Interface inspirada no layout do WhatsApp Web.

- Campo para digitar e enviar novas mensagens.

🔹 **3. Envio de Mensagens via Puppeteer**

- Ao enviar uma mensagem pela interface web:

    - A automação localiza a conversa correspondente no WhatsApp Web real.

    - Insere o texto no campo de mensagem.

    - Simula o clique no botão de envio.

---

## 🧰 Tecnologias Utilizadas

🟢 **Node.js** – ambiente de execução JavaScript

🧭 **Puppeteer** – automação de navegador via Chrome

⚙️ **Express.js** – API para comunicação entre front-end e back-end

🛢️ **SQLite** – banco de dados leve e local

🌐 **HTML/CSS/JS** – front-end simples, sem frameworks pesados

---

## 📁 Estrutura do Projeto

```bash
whatsapp-bot/
│
├── database/
│   └── db.js           # Banco de dados SQLite
│
├── puppeteer/
│   └── bot.js          # Código de automação do WhatsApp Web
│
├── server/
│   └── index.js        # API com Express
│
├── frontend/
│   ├── index.html      # Interface web
│   └── app.js          # Lógica de interface
│
├── README.md
└── package.json
```

---

## 📥 Como Rodar o Projeto

### Passo 1: Clonar o repositório

```bash
git clone https://github.com/FelipeGalway/whatsapp-bot
cd whatsapp-bot
```

### Passo 2: Instalar dependências

- Se o projeto já inclui `package.json` (recomendado), execute:

```bash
npm install
```

- Caso o `package.json` não exista, inicialize o projeto e instale as dependências:

```bash
npm init -y
npm install express cors sqlite3 puppeteer
```

### Passo 3: Iniciar o servidor da API

```bash
node server/index.js
```

- A API estará disponível em: `http://localhost:3000`

### Passo 4: Executar o bot (em outro terminal)

```bash
node puppeteer/bot.js
```

- Um navegador será aberto com o WhatsApp Web.

- Escaneie o QR Code com seu celular.

- O bot fará a varredura dos contatos e mensagens, salvando no banco SQLite em `database/whatsapp.db`.

### Passo 5: Abrir a interface web

- Navegue até o arquivo `frontend/index.html` ou acesse diretamente via navegador:
`http://localhost:3000/index.html`

- Caso não funcione, utilize uma extensão para servir arquivos estáticos, como Live Server ou Five Server.

- Funcionalidades da interface:

    - Carrega contatos e mensagens do banco SQLite

    - Interface web simulando o WhatsApp

    - Envio de mensagens via front-end

### Passo 6: Finalizando o uso

- Para encerrar, pressione `Ctrl + C` em cada terminal onde estão rodando o bot e o servidor da API.

- Para limpar os dados do banco:

```bash
sqlite3 database/whatsapp.db
```

- No prompt do SQLite, execute:

```sql
DELETE FROM contacts;
DELETE FROM messages;
```

- Alternativamente, você pode excluir manualmente o arquivo `database/whatsapp.db` para reiniciar o banco.

---

## 📌 Observação

- A automação depende de seletores do WhatsApp Web, que podem mudar ao longo do tempo. Ajustes podem ser necessários se o layout da página for atualizado.