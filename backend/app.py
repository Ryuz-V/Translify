from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import os
import logging
from functools import lru_cache

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

LIBRETRANSLATE_URL = os.getenv('LIBRETRANSLATE_URL', 'http://libretranslate:5000')
API_TIMEOUT = int(os.getenv('API_TIMEOUT', '30'))

@lru_cache(maxsize=1000)
def cached_translate(text, source_lang, target_lang):
    """Fungsi terjemahan dengan cache untuk teks yang sama"""
    return translate_text(text, source_lang, target_lang)

def translate_text(text, source_lang, target_lang):
    """Mengirim request ke LibreTranslate"""
    try:
        payload = {
            'q': text,
            'source': source_lang,
            'target': target_lang,
            'format': 'text',
            'api_key': ''  
        }
        
        response = requests.post(
            f"{LIBRETRANSLATE_URL}/translate",
            json=payload,
            timeout=API_TIMEOUT
        )
        
        if response.status_code == 200:
            return response.json().get('translatedText', '')
        else:
            app.logger.error(f"LibreTranslate error: {response.status_code}")
            return f"Error: {response.status_code}"
            
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Connection error: {str(e)}")
        return f"Connection error: {str(e)}"

@app.route('/health')
def health_check():
    """Health check endpoint untuk Docker"""
    try:
        resp = requests.get(f"{LIBRETRANSLATE_URL}/languages", timeout=5)
        if resp.status_code == 200:
            return jsonify({"status": "healthy", "libretranslate": "connected"}), 200
        else:
            return jsonify({"status": "unhealthy", "libretranslate": "disconnected"}), 500
    except:
        return jsonify({"status": "unhealthy", "libretranslate": "disconnected"}), 500

@app.route('/api/translate', methods=['POST'])
def api_translate():
    """API endpoint untuk terjemahan"""
    data = request.get_json()
    
    text = data.get('text', '').strip()
    source_lang = data.get('source_lang', 'id')
    target_lang = data.get('target_lang', 'en')
    
    if not text:
        return jsonify({'error': 'Text is empty'}), 400
    
    if len(text) > 5000:
        return jsonify({'error': 'Text too long (max 5000 characters)'}), 400
    
    translated = cached_translate(text, source_lang, target_lang)
    
    return jsonify({
        'original_text': text,
        'translated_text': translated,
        'source_lang': source_lang,
        'target_lang': target_lang
    })

@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Get supported languages from LibreTranslate"""
    try:
        response = requests.get(f"{LIBRETRANSLATE_URL}/languages", timeout=10)
        return jsonify(response.json()), 200
    except:
        return jsonify([
            {"code": "en", "name": "English"},
            {"code": "id", "name": "Indonesian"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "ja", "name": "Japanese"},
            {"code": "zh", "name": "Chinese"},
            {"code": "ar", "name": "Arabic"}
        ]), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)