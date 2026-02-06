const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const path = require('path');
const fs = require('fs'); // Tambahkan fs untuk cek file

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Tampilkan info lokasi
console.log('Current working directory:', process.cwd());
console.log('Server file location:', __dirname);

// Cek apakah index.html ada di direktori yang sama
const indexPath = path.join(__dirname, 'index.html');
console.log('Looking for index.html at:', indexPath);

if (fs.existsSync(indexPath)) {
    console.log('✓ index.html ditemukan');
} else {
    console.log('✗ index.html TIDAK ditemukan');
    // Tampilkan file apa saja yang ada
    console.log('Files in directory:');
    fs.readdirSync(__dirname).forEach(file => {
        console.log('  -', file);
    });
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files dari direktori yang sama
app.use(express.static(__dirname));

// Serve static files dari folder asset jika ada
const assetPath = path.join(__dirname, 'asset');
if (fs.existsSync(assetPath)) {
    app.use('/asset', express.static(assetPath));
}

// Root endpoint - serve index.html dengan error handling
app.get('/', (req, res) => {
    try {
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            // Fallback: coba cari di parent directory atau lokasi lain
            const possiblePaths = [
                indexPath,
                path.join(__dirname, 'public', 'index.html'),
                path.join(__dirname, 'src', 'index.html'),
                path.join(process.cwd(), 'index.html')
            ];
            
            let found = false;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    console.log('Found index.html at alternative path:', p);
                    res.sendFile(p);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                res.status(404).send(`
                    <h1>File index.html tidak ditemukan</h1>
                    <p>Server berjalan di: ${__dirname}</p>
                    <p>Mencari file di:</p>
                    <ul>
                        <li>${indexPath}</li>
                        <li>${path.join(__dirname, 'public', 'index.html')}</li>
                        <li>${path.join(__dirname, 'src', 'index.html')}</li>
                        <li>${path.join(process.cwd(), 'index.html')}</li>
                    </ul>
                    <p>Pastikan index.html ada di salah satu lokasi di atas.</p>
                `);
            }
        }
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Internal server error');
    }
});

// Konfigurasi LibreTranslate
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

// Endpoint untuk translate
app.post('/api/translate', async (req, res) => {
    try {
        const { text, source_lang = 'id', target_lang = 'en' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const response = await axios.post(`${LIBRETRANSLATE_URL}/translate`, {
            q: text,
            source: source_lang,
            target: target_lang,
            format: 'text',
            alternatives: 3,
            api_key: process.env.LIBRETRANSLATE_API_KEY || ''
        });

        res.json(response.data);
    } catch (error) {
        console.error('Translation error:', error.message);
        res.status(500).json({ 
            error: 'Translation failed', 
            details: error.message 
        });
    }
});

// Endpoint untuk mendapatkan bahasa yang tersedia
app.get('/api/languages', async (req, res) => {
    try {
        const response = await axios.get(`${LIBRETRANSLATE_URL}/languages`);
        res.json(response.data);
    } catch (error) {
        console.error('Languages error:', error.message);
        // Fallback languages jika server LibreTranslate tidak tersedia
        res.json([
            { code: 'id', name: 'Indonesia' },
            { code: 'en', name: 'English' },
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' },
            { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' },
            { code: 'zh', name: 'Chinese' },
            { code: 'ar', name: 'Arabic' },
            { code: 'ru', name: 'Russian' }
        ]);
    }
});

// Endpoint health check
app.get('/api/health', async (req, res) => {
    try {
        await axios.get(`${LIBRETRANSLATE_URL}/frontend/settings`);
        res.json({ status: 'ok', libreTranslate: 'connected' });
    } catch (error) {
        res.json({ status: 'ok', libreTranslate: 'disconnected' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌐 LibreTranslate URL: ${LIBRETRANSLATE_URL}`);
    console.log(`📁 Static files served from: ${__dirname}`);
    console.log(`📍 Current working directory: ${process.cwd()}`);
});