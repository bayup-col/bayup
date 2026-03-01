const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
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
    console.log('QR GENERADO - POR FAVOR ESCANEA EL CÓDIGO ABAJO:');
    
    // Imprimir QR en la terminal (Logs de Railway)
    qrcodeTerminal.generate(qr, { small: true });
    
    // Guardar en base64 para el socket
    qrcode.toDataURL(qr, (err, url) => {
        lastQRUrl = url;
        io.emit('qr', url);
    });

    // Guardar como archivo físico por si acaso
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

app.get('/qr', (req, res) => {
    if (connectionStatus === 'ready') {
        return res.send('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#e8f5e9;"><div style="text-align:center;background:white;padding:40px;border-radius:30px;box-shadow:0 10px 30px rgba(0,0,0,0.05); border: 2px solid #4caf50;"><h1 style="color:#2e7d32;">✅ ¡WhatsApp Conectado!</h1><p style="color:#666;">Bayup ya puede enviar mensajes.</p></div></body></html>');
    }
    if (!lastQRUrl) {
        return res.send('<html><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#fff;"><div style="text-align:center;"><h1>Generando QR...</h1><p>Por favor refresca en 5 segundos.</p><script>setTimeout(()=>location.reload(), 5000)</script></div></body></html>');
    }
    res.send(`
        <html>
            <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;margin:0;">
                <div style="background:white;padding:50px;border-radius:40px;box-shadow:0 20px 50px rgba(0,0,0,0.1);text-align:center;max-width:400px;">
                    <img src="https://bayup.com.co/assets/logo.png" style="height:40px;margin-bottom:20px;display:none;" onerror="this.style.display='none'" />
                    <h2 style="margin:0 0 10px 0;font-weight:900;text-transform:uppercase;letter-spacing:-1px;">Vincular WhatsApp</h2>
                    <p style="color:#666;font-size:14px;margin-bottom:30px;">Escanea este código con tu celular para activar las notificaciones de Bayup.</p>
                    <div style="background:#f8fafc;padding:20px;border-radius:20px;border:1px dashed #cbd5e1;">
                        <img src="${lastQRUrl}" style="width:280px;height:280px;display:block;" />
                    </div>
                    <p style="margin-top:30px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:800;">Bayup Bridge Engine v1.0</p>
                </div>
                <script>
                    // Auto-recarga cada 30 segundos para mantener el QR fresco
                    setTimeout(() => location.reload(), 30000);
                </script>
            </body>
        </html>
    `);
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
