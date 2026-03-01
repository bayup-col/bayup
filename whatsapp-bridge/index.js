const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        headless: true
    }
});

let lastQRUrl = null;
let connectionStatus = 'disconnected'; // disconnected, qr, ready

io.on('connection', (socket) => {
    console.log('Client connected to bridge');
    // Enviar estado actual inmediatamente
    socket.emit('status', connectionStatus);
    if (lastQRUrl) {
        socket.emit('qr', lastQRUrl);
    }
});

const fs = require('fs');

client.on('qr', (qr) => {
    connectionStatus = 'qr';
    console.log('QR GENERATED - PLEASE SCAN SCAN_ME.png');
    
    // Guardar en base64 para el socket
    qrcode.toDataURL(qr, (err, url) => {
        lastQRUrl = url;
        io.emit('qr', url);
    });

    // Guardar como archivo físico para escaneo directo
    qrcode.toFile('./SCAN_ME.png', qr, {
        color: { dark: '#000', light: '#FFF' }
    }, (err) => {
        if (err) console.error("Error al guardar QR", err);
    });
});

client.on('ready', () => {
    connectionStatus = 'ready';
    lastQRUrl = null;
    console.log('WHATSAPP READY');
    io.emit('ready', { status: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', (msg) => {
    console.error('AUTH FAILURE', msg);
    connectionStatus = 'disconnected';
    io.emit('status', 'disconnected');
});

client.on('message', async (msg) => {
    console.log('MESSAGE RECEIVED', msg.body);
    io.emit('new_message', {
        from: msg.from,
        body: msg.body,
        name: msg._data.notifyName
    });
});

app.get('/status', (req, res) => {
    res.json({ status: connectionStatus });
});

app.post('/send', express.json(), async (req, res) => {
    if (connectionStatus !== 'ready') return res.status(400).json({ error: 'Not connected' });
    const { to, body } = req.body;
    try {
        const msg = await client.sendMessage(to, body);
        res.json({ success: true, message: msg.body });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/chats/:id/messages', async (req, res) => {
    if (connectionStatus !== 'ready') return res.status(400).json({ error: 'Not connected' });
    try {
        const chat = await client.getChatById(req.params.id);
        const messages = await chat.fetchMessages({ limit: 50 });
        const cleanMessages = messages.map(m => ({
            id: m.id._serialized,
            body: m.body,
            fromMe: m.fromMe,
            timestamp: m.timestamp,
            time: new Date(m.timestamp * 1000).toLocaleTimeString(),
            author: m.author || m.from
        }));
        res.json(cleanMessages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/chats', async (req, res) => {
    if (connectionStatus !== 'ready') return res.status(400).json({ error: 'Not connected' });
    try {
        const chats = await client.getChats();
        const cleanChats = chats.map(c => ({
            id: c.id._serialized,
            name: c.name,
            lastMsg: c.lastMessage ? c.lastMessage.body : '',
            time: new Date(c.timestamp * 1000).toLocaleTimeString(),
            unread: c.unreadCount
        }));
        res.json(cleanChats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

client.initialize();

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
    console.log(`WhatsApp Bridge running on port ${PORT}`);
});
