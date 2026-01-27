class Translator {
    constructor() {
        this.baseUrl = '/api';
        this.inputText = document.getElementById('input-text');
        this.outputText = document.getElementById('output-text');
        this.translateButton = document.querySelector('button.bg-blue-600');
        this.fromSelect = document.querySelectorAll('select')[0];
        this.toSelect = document.querySelectorAll('select')[1];
        this.swapButton = document.querySelector('button[title="Tukar bahasa"]');
        
        this.init();
    }

    async init() {
        // Load available languages
        await this.loadLanguages();
        
        // Event listeners
        this.translateButton.addEventListener('click', () => this.translate());
        this.swapButton.addEventListener('click', () => this.swapLanguages());
        
        // Auto-translate on input (debounced)
        let timeout;
        this.inputText.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.inputText.value.trim()) {
                    this.translate();
                }
            }, 500);
        });
        
        // Change language event
        this.fromSelect.addEventListener('change', () => {
            if (this.inputText.value.trim()) {
                this.translate();
            }
        });
        
        this.toSelect.addEventListener('change', () => {
            if (this.inputText.value.trim()) {
                this.translate();
            }
        });
        
        // Check server health
        this.checkHealth();
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();
            
            if (data.libreTranslate === 'disconnected') {
                console.warn('LibreTranslate server is not connected. Using fallback mode.');
                this.showNotification('LibreTranslate server tidak terhubung. Beberapa fitur mungkin terbatas.', 'warning');
            }
        } catch (error) {
            console.error('Server connection error:', error);
            this.showNotification('Backend server tidak berjalan. Jalankan "npm start" di terminal.', 'error');
        }
    }

    async loadLanguages() {
        try {
            const response = await fetch(`${this.baseUrl}/languages`);
            const languages = await response.json();
            
            // Clear existing options
            this.fromSelect.innerHTML = '';
            this.toSelect.innerHTML = '';
            
            // Add language options
            languages.forEach(lang => {
                const optionFrom = document.createElement('option');
                optionFrom.value = lang.code;
                optionFrom.textContent = lang.name;
                
                const optionTo = document.createElement('option');
                optionTo.value = lang.code;
                optionTo.textContent = lang.name;
                
                this.fromSelect.appendChild(optionFrom.cloneNode(true));
                this.toSelect.appendChild(optionTo);
            });
            
            // Set default values
            this.fromSelect.value = 'id'; // Indonesian
            this.toSelect.value = 'en';   // English
            
        } catch (error) {
            console.error('Failed to load languages:', error);
            // Fallback to hardcoded languages
            this.setFallbackLanguages();
        }
    }

    setFallbackLanguages() {
        const languages = [
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
        ];
        
        languages.forEach(lang => {
            const optionFrom = document.createElement('option');
            optionFrom.value = lang.code;
            optionFrom.textContent = lang.name;
            
            const optionTo = document.createElement('option');
            optionTo.value = lang.code;
            optionTo.textContent = lang.name;
            
            this.fromSelect.appendChild(optionFrom.cloneNode(true));
            this.toSelect.appendChild(optionTo);
        });
        
        this.fromSelect.value = 'id';
        this.toSelect.value = 'en';
    }

    async translate() {
        const text = this.inputText.value.trim();
        const sourceLang = this.fromSelect.value;
        const targetLang = this.toSelect.value;
        
        if (!text) {
            this.outputText.value = '';
            return;
        }
        
        // Show loading state
        const originalButtonHTML = this.translateButton.innerHTML;
        this.outputText.value = 'Menerjemahkan...';
        this.translateButton.disabled = true;
        this.translateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Menerjemahkan...</span>';
        
        try {
            const response = await fetch(`${this.baseUrl}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    source_lang: sourceLang,
                    target_lang: targetLang
                })
            });
            
            const data = await response.json();
            
            if (data.translatedText) {
                this.outputText.value = data.translatedText;
            } else {
                throw new Error('No translation received');
            }
            
        } catch (error) {
            console.error('Translation error:', error);
            this.outputText.value = '❌ Gagal menerjemahkan. Periksa koneksi server.';
            
        } finally {
            // Reset button state
            this.translateButton.disabled = false;
            this.translateButton.innerHTML = originalButtonHTML;
        }
    }

    swapLanguages() {
        const fromValue = this.fromSelect.value;
        const toValue = this.toSelect.value;
        
        // Swap values
        this.fromSelect.value = toValue;
        this.toSelect.value = fromValue;
        
        // Swap text content
        const inputText = this.inputText.value;
        this.inputText.value = this.outputText.value;
        this.outputText.value = inputText;
        
        // Translate if there's text
        if (this.inputText.value.trim()) {
            this.translate();
        }
    }

    showNotification(message, type = 'info') {
        // Buat elemen notifikasi
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
            type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle'
                } mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove setelah 5 detik
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Translator();
});