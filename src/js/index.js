// initCustomDropdown: buat dropdown kustom yang bisa di-set options
function initCustomDropdown(buttonId, listId, onSelect) {
    const btn = document.getElementById(buttonId);
    const list = document.getElementById(listId);

    // safety check
    if (!btn || !list) {
        console.warn('initCustomDropdown: element missing', buttonId, listId);
        return {
            setOptions() { /* noop */ }
        };
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        list.classList.toggle('hidden');
    });

    // tutup kalau klik di luar
    document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !list.contains(e.target)) {
            list.classList.add('hidden');
        }
    });

    // keyboard: esc tutup
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') list.classList.add('hidden');
    });

    return {
        setOptions(langs = [], defaultCode) {
            list.innerHTML = '';
            langs.forEach(lang => {
                const li = document.createElement('li');
                li.textContent = lang.name;
                li.dataset.code = lang.code;
                li.className = 'px-3 py-2 hover:bg-gray-100 cursor-pointer truncate truncate-ellipsis';
                li.onclick = (ev) => {
                    ev.stopPropagation();
                    btn.textContent = lang.name;
                    list.classList.add('hidden');
                    onSelect && onSelect(lang.code);
                };
                list.appendChild(li);

                // set default label
                if (lang.code === defaultCode) {
                    btn.textContent = lang.name;
                }
            });
        }
    };
}

class Translator {
    constructor() {
        this.baseUrl = '/api';
        this.inputText = document.getElementById('input-text');
        this.outputText = document.getElementById('output-text');
        this.swapButton = document.getElementById('swapBtn');
        this.translationStatus = document.getElementById('translationStatus');
        
        // state bahasa
        this.fromLang = 'id';
        this.toLang = 'en';

        // init custom dropdowns
        this.fromDropdown = initCustomDropdown('fromBtn', 'fromList', (code) => {
            this.fromLang = code;
            this.autoTranslate();
        });

        this.toDropdown = initCustomDropdown('toBtn', 'toList', (code) => {
            this.toLang = code;
            this.autoTranslate();
        });

        // safety: if dropdown init failed
        if (!this.fromDropdown || !this.fromDropdown.setOptions) {
            this.fromDropdown = { setOptions() {} };
        }
        if (!this.toDropdown || !this.toDropdown.setOptions) {
            this.toDropdown = { setOptions() {} };
        }

        // Untuk debounce
        this.translateTimeout = null;
        this.debounceDelay = 800; // Delay untuk auto-translate
        this.isTranslating = false; // Flag untuk mencegah multiple requests

        this.init();
    }

    init = async () => {
        try {
            // Load available languages
            await this.loadLanguages();

            // Event listeners
            if (this.swapButton) {
                this.swapButton.addEventListener('click', () => this.swapLanguages());
            }

            // Auto-translate on input (debounced)
            if (this.inputText) {
                this.inputText.addEventListener('input', () => {
                    this.autoTranslate();
                });
            }

            // Check server health
            await this.checkHealth();

            console.log('Translator initialized successfully');
        } catch (error) {
            console.error('Error initializing translator:', error);
        }
    }

    // Fungsi untuk check health
    checkHealth = async () => {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            const data = await response.json();

            if (data.libreTranslate === 'disconnected') {
                console.warn('LibreTranslate server is not connected. Using fallback mode.');
                this.showNotification('LibreTranslate server tidak terhubung. Beberapa fitur mungkin terbatas.', 'warning');
            } else {
                console.log('LibreTranslate server connected');
            }
        } catch (error) {
            console.error('Server connection error:', error);
            this.showNotification('Backend server tidak berjalan. Jalankan "npm start" di terminal.', 'error');
        }
    }

    // Fungsi untuk load languages
    loadLanguages = async () => {
        try {
            console.log('Loading languages...');
            const response = await fetch(`${this.baseUrl}/languages`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const languages = await response.json();
            console.log('Languages loaded:', languages);

            // Set options to custom dropdowns
            if (this.fromDropdown.setOptions) {
                this.fromDropdown.setOptions(languages, 'id');
            }
            
            if (this.toDropdown.setOptions) {
                this.toDropdown.setOptions(languages, 'en');
            }

            // ensure internal state
            this.fromLang = 'id';
            this.toLang = 'en';
            
            console.log('Languages set successfully');
        } catch (error) {
            console.error('Failed to load languages:', error);
            // Fallback to hardcoded languages
            this.setFallbackLanguages();
        }
    }

    setFallbackLanguages = () => {
        console.log('Using fallback languages');
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

        if (this.fromDropdown.setOptions) {
            this.fromDropdown.setOptions(languages, 'id');
        }
        
        if (this.toDropdown.setOptions) {
            this.toDropdown.setOptions(languages, 'en');
        }

        this.fromLang = 'id';
        this.toLang = 'en';
    }

    // Fungsi baru untuk auto-translate dengan debounce
    autoTranslate = () => {
        // Clear timeout sebelumnya
        if (this.translateTimeout) {
            clearTimeout(this.translateTimeout);
        }

        // Jika sedang menerjemahkan, tunggu selesai
        if (this.isTranslating) {
            return;
        }

        // Jika input kosong, kosongkan output
        if (!this.inputText || !this.inputText.value.trim()) {
            if (this.outputText) {
                this.outputText.value = '';
            }
            this.hideTranslationStatus();
            return;
        }

        // Tampilkan status "Menerjemahkan..."
        this.showTranslationStatus();

        // Set timeout untuk debounce
        this.translateTimeout = setTimeout(() => {
            this.translate();
        }, this.debounceDelay);
    }

    // Fungsi untuk menampilkan status terjemahan
    showTranslationStatus = () => {
        if (this.translationStatus) {
            this.translationStatus.classList.remove('hidden');
            this.translationStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Menerjemahkan...</span>';
        }
    }

    // Fungsi untuk menyembunyikan status terjemahan
    hideTranslationStatus = () => {
        if (this.translationStatus) {
            this.translationStatus.classList.add('hidden');
        }
    }

    translate = async () => {
        if (this.isTranslating) {
            return; // Prevent multiple simultaneous translations
        }

        const text = this.inputText ? this.inputText.value.trim() : '';
        const sourceLang = this.fromLang;
        const targetLang = this.toLang;

        if (!sourceLang || !targetLang) {
            console.error('Language not set');
            this.hideTranslationStatus();
            return;
        }
        
        if (!text) {
            if (this.outputText) {
                this.outputText.value = '';
            }
            this.hideTranslationStatus();
            return;
        }

        this.isTranslating = true;

        try {
            console.log('Translating:', { text, sourceLang, targetLang });
            
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Translation response:', data);

            // Proses respons
            let translatedText = '';
            
            if (data.translatedText) {
                translatedText = data.translatedText;
            } else if (Array.isArray(data) && data[0] && data[0].translatedText) {
                translatedText = data[0].translatedText;
            } else if (data?.translatedText === '' && data?.error) {
                throw new Error(data.error);
            } else if (typeof data === 'string') {
                translatedText = data;
            } else {
                translatedText = data?.translatedText ?? '❌ Format respons tidak dikenali';
            }

            // Set output text
            if (this.outputText) {
                this.outputText.value = translatedText;
            }

            // Sembunyikan status
            this.hideTranslationStatus();
            
            // Tampilkan notifikasi sukses
            setTimeout(() => {
                this.showNotification('Terjemahan berhasil', 'success');
            }, 300);

        } catch (error) {
            console.error('Translation error:', error);
            
            // Set error message in output
            if (this.outputText) {
                this.outputText.value = '❌ Gagal menerjemahkan. Periksa koneksi server.';
            }
            
            this.hideTranslationStatus();
            this.showNotification('Gagal menerjemahkan: ' + error.message, 'error');
        } finally {
            this.isTranslating = false;
        }
    }

    swapLanguages = () => {
        // swap codes
        [this.fromLang, this.toLang] = [this.toLang, this.fromLang];

        // swap text areas
        if (this.inputText && this.outputText) {
            [this.inputText.value, this.outputText.value] = [this.outputText.value, this.inputText.value];
        }

        // swap labels/buttons
        const fromBtn = document.getElementById('fromBtn');
        const toBtn = document.getElementById('toBtn');
        
        if (fromBtn && toBtn) {
            [fromBtn.textContent, toBtn.textContent] = [toBtn.textContent, fromBtn.textContent];
        }

        // Auto-translate setelah swap jika ada teks
        if (this.inputText && this.inputText.value.trim()) {
            this.autoTranslate();
        }
    }

    // Fungsi untuk menampilkan notifikasi
    showNotification = (message, type = 'info') => {
        // Hapus notifikasi sebelumnya jika ada
        const existingNotif = document.querySelector('.notification-translify');
        if (existingNotif) {
            existingNotif.remove();
        }
        
        const notification = document.createElement('div');
        
        let icon = 'info-circle';
        let bgColor = 'bg-blue-100';
        let textColor = 'text-blue-800';
        let borderColor = 'border-blue-300';
        
        if (type === 'error') {
            icon = 'exclamation-circle';
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            borderColor = 'border-red-300';
        } else if (type === 'warning') {
            icon = 'exclamation-triangle';
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            borderColor = 'border-yellow-300';
        } else if (type === 'success') {
            icon = 'check-circle';
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            borderColor = 'border-green-300';
        }
        
        notification.className = `notification-translify fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${bgColor} ${textColor} ${borderColor} border`;
        notification.style.maxWidth = '400px';

        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${icon} mr-2"></i>
                <span class="flex-1">${message}</span>
                <button class="ml-4 text-gray-500 hover:text-gray-700" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-hide setelah 5 detik
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Tunggu DOM siap sepenuhnya
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Translator...');
    
    // Tambah delay kecil untuk memastikan semua elemen tersedia
    setTimeout(() => {
        try {
            const translator = new Translator();
            window.translator = translator; // Untuk debugging di console
            console.log('Translator instance created:', translator);
        } catch (error) {
            console.error('Failed to create Translator:', error);
        }
    }, 100);
});

// Fallback jika DOM sudah siap sebelum script dimuat
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('Document already ready, initializing Translator immediately...');
    setTimeout(() => {
        try {
            const translator = new Translator();
            window.translator = translator;
            console.log('Translator instance created (immediate):', translator);
        } catch (error) {
            console.error('Failed to create Translator (immediate):', error);
        }
    }, 100);
}