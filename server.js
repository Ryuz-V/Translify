const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // untuk serve file statis

// Konfigurasi LibreTranslate
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

// Root endpoint - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
});