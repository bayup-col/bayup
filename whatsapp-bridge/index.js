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
        args: ['--no-sandbox']
    }
});

let lastQR = null;
let connectionStatus = 'disconnected'; // disconnected, qr, ready

client.on('qr', (qr) => {
    lastQR = qr;
    connectionStatus = 'qr';
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
        io.emit('qr', url);
    });
});

client.on('ready', () => {
    connectionStatus = 'ready';
    lastQR = null;
    console.log('CLIENT IS READY');
    io.emit('ready', { status: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
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

app.get('/chats', async (req, res) => {
    if (connectionStatus !== 'ready') return res.status(400).json({ error: 'Not connected' });
    const chats = await client.getChats();
    const cleanChats = chats.map(c => ({
        id: c.id._serialized,
        name: c.name,
        lastMsg: c.lastMessage ? c.lastMessage.body : '',
        time: new Date(c.timestamp * 1000).toLocaleTimeString(),
        unread: c.unreadCount
    }));
    res.json(cleanChats);
});

client.initialize();

const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
    console.log(`WhatsApp Bridge running on port ${PORT}`);
});
