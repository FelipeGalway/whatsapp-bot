# 📱 WhatsApp Bot com Puppeteer e Interface Web

Este projeto é uma automação desenvolvida por **Felipe Ferreira**, utilizando **Node.js**, **Puppeteer**, **SQLite** e uma interface web simples. Ele interage com o **WhatsApp Web** de forma automatizada, com o objetivo de simular funcionalidades básicas do aplicativo: **capturar e exibir conversas**, além de **permitir o envio de mensagens** por meio de uma interface personalizada.

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

## 🧰 Tecnologias Utilizadas

🟢 **Node.js** – ambiente de execução JavaScript

🧭 **Puppeteer** – automação de navegador via Chrome

⚙️ **Express.js** – API para comunicação entre front-end e back-end

🛢️ **SQLite** – banco de dados leve e local

🌐 **HTML/CSS/JS** – front-end simples, sem frameworks pesados

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

## 📌 Observações

- A automação depende de seletores do WhatsApp Web, que podem mudar ao longo do tempo. Ajustes podem ser necessários se o layout da página for atualizado.

- Este projeto é educacional e não deve ser utilizado para fins comerciais ou violar os termos de serviço do WhatsApp.

## 📥 Como Rodar o Projeto

- Clone o repositório:
    ```bash
    git clone https://github.com/FelipeGalway/whatsapp-bot
    cd whatsapp-bot
    ```

- Inicialize o projeto (caso ainda não exista `package.json`):
    ```bash
    npm init -y
    ```

- Instale as dependências:
    ```bash
    npm install express cors sqlite3 puppeteer
    ```

- Inicie o servidor da API (Express):
    ```bash
    node server/index.js
    ```

    - A API estará disponível em: http://localhost:3000

- Em outro terminal, execute o bot com Puppeteer:
    ```bash
    node puppeteer/bot.js
    ```

    - Um navegador será aberto com o WhatsApp Web.

    - Escaneie o QR Code com seu celular.

    - O bot fará a varredura dos contatos e mensagens, salvando no banco SQLite (`database/whatsapp.db`).

- Abra a interface web:

    - Navegue até o arquivo `frontend/index.html`

    - Você pode abrir no navegador diretamente, ou usar uma extensão como Live Server (VS Code) ou Five Server para evitar problemas com CORS.

    - Funcionalidades:

        - Carrega contatos e mensagens diretamente do banco

        - Interface web simulando o WhatsApp

        - Envio de mensagens via front-end 
    