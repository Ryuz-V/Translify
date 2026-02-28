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
                li.className = 'px-4 py-2 hover:bg-gray-50 cursor-pointer truncate text-gray-700 text-sm font-medium transition-colors';
                li.onclick = (ev) => {
                    ev.stopPropagation();
                    // Update text content only (preserve chevron icon)
                    const textSpan = btn.querySelector('span.truncate') || btn;
                    if (textSpan !== btn) {
                        textSpan.textContent = lang.name;
                    } else {
                        // Fallback if no span found (legacy structure)
                        btn.textContent = lang.name;
                    }

                    list.classList.add('hidden');
                    onSelect && onSelect(lang.code);
                };
                list.appendChild(li);

                // set default label
                if (lang.code === defaultCode) {
                    const textSpan = btn.querySelector('span.truncate') || btn;
                    if (textSpan !== btn) {
                        textSpan.textContent = lang.name;
                    } else {
                        btn.textContent = lang.name;
                    }
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

        this.listenInputBtn = document.getElementById('listenInputBtn');
        this.listenOutputBtn = document.getElementById('listenOutputBtn');
        this.micInputBtn = document.getElementById('micInputBtn');
        this.copyInputBtn = document.getElementById('copyInputBtn');
        this.copyOutputBtn = document.getElementById('copyOutputBtn');

        this.recognition = null;
        this.isRecording = false;

        // Mode Switching Elements
        this.textModeBtn = document.getElementById('textModeBtn');
        this.docModeBtn = document.getElementById('docModeBtn');
        this.textTranslationArea = document.getElementById('textTranslationArea');
        this.docTranslationArea = document.getElementById('docTranslationArea');

        // Document Translation Elements
        this.documentUploadInput = document.getElementById('documentUploadInput');
        this.fileUploadState = document.getElementById('fileUploadState');
        this.fileName = document.getElementById('fileName');
        this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
        this.translateDocBtn = document.getElementById('translateDocBtn');
        this.selectedFile = null;

        // Settings Elements
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsDropdown = document.getElementById('settingsDropdown');
        this.voiceSpeedSelect = document.getElementById('voiceSpeedSelect');
        this.testVoiceBtn = document.getElementById('testVoiceBtn');

        this.voiceRate = this.voiceSpeedSelect ? (parseFloat(this.voiceSpeedSelect.value) || 1.0) : 1.0;

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
            this.fromDropdown = { setOptions() { } };
        }
        if (!this.toDropdown || !this.toDropdown.setOptions) {
            this.toDropdown = { setOptions() { } };
        }

        // Init document dropdowns
        this.docFromDropdown = initCustomDropdown('docFromBtn', 'docFromList', (code) => {
            this.docFromLang = code;
        });

        this.docToDropdown = initCustomDropdown('docToBtn', 'docToList', (code) => {
            this.docToLang = code;
        });

        if (!this.docFromDropdown || !this.docFromDropdown.setOptions) {
            this.docFromDropdown = { setOptions() { } };
        }
        if (!this.docToDropdown || !this.docToDropdown.setOptions) {
            this.docToDropdown = { setOptions() { } };
        }

        this.docFromLang = 'id';
        this.docToLang = 'en';

        // Untuk debounce
        this.translateTimeout = null;
        this.debounceDelay = 800; // Delay untuk auto-translate
        this.isTranslating = false; // Flag untuk mencegah multiple requests

        this.init();
    }

    init = async () => {
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

        // Speech Recognition
        this.initSpeechRecognition();

        // Text-to-Speech Listeners
        if (this.listenInputBtn) {
            this.listenInputBtn.addEventListener('click', () => {
                this.speakText(this.inputText ? this.inputText.value : '', this.fromLang);
            });
        }

        if (this.listenOutputBtn) {
            this.listenOutputBtn.addEventListener('click', () => {
                this.speakText(this.outputText ? this.outputText.value : '', this.toLang);
            });
        }

        // Copy Text Listeners
        if (this.copyInputBtn) {
            this.copyInputBtn.addEventListener('click', () => {
                this.copyText(this.inputText ? this.inputText.value : '');
            });
        }

        if (this.copyOutputBtn) {
            this.copyOutputBtn.addEventListener('click', () => {
                this.copyText(this.outputText ? this.outputText.value : '');
            });
        }

        // Settings Menu Listeners
        if (this.settingsBtn && this.settingsDropdown) {
            this.settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.settingsDropdown.classList.toggle('hidden');
            });

            document.addEventListener('click', (e) => {
                if (!this.settingsBtn.contains(e.target) && !this.settingsDropdown.contains(e.target)) {
                    this.settingsDropdown.classList.add('hidden');
                }
            });
        }

        if (this.voiceSpeedSelect) {
            this.voiceSpeedSelect.addEventListener('change', (e) => {
                this.voiceRate = parseFloat(e.target.value);
            });
        }

        if (this.testVoiceBtn) {
            this.testVoiceBtn.addEventListener('click', () => {
                this.speakText('Ini adalah contoh kecepatan suara dari pengaturan sistem.', 'id');
            });
        }

        // Mode Switching
        if (this.textModeBtn) {
            this.textModeBtn.addEventListener('click', () => this.switchMode('text'));
        }
        if (this.docModeBtn) {
            this.docModeBtn.addEventListener('click', () => this.switchMode('document'));
        }

        // Document Upload Listeners
        if (this.documentUploadInput) {
            this.documentUploadInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        if (this.cancelUploadBtn) {
            this.cancelUploadBtn.addEventListener('click', () => this.cancelFileUpload());
        }
        if (this.translateDocBtn) {
            this.translateDocBtn.addEventListener('click', () => this.translateDocument());
        }

        try {
            // Load available languages
            await this.loadLanguages();

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

            if (this.docFromDropdown.setOptions) {
                this.docFromDropdown.setOptions(languages, 'id');
            }

            if (this.docToDropdown.setOptions) {
                this.docToDropdown.setOptions(languages, 'en');
            }

            // ensure internal state
            this.fromLang = 'id';
            this.toLang = 'en';
            this.docFromLang = 'id';
            this.docToLang = 'en';

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

        if (this.docFromDropdown.setOptions) {
            this.docFromDropdown.setOptions(languages, 'id');
        }

        if (this.docToDropdown.setOptions) {
            this.docToDropdown.setOptions(languages, 'en');
        }

        this.fromLang = 'id';
        this.toLang = 'en';
        this.docFromLang = 'id';
        this.docToLang = 'en';
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
            this.toggleListenButtons();
            return;
        }

        // Tampilkan status "Menerjemahkan..."
        this.showTranslationStatus();
        this.toggleListenButtons();

        // Set timeout untuk debounce
        this.translateTimeout = setTimeout(() => {
            this.translate();
        }, this.debounceDelay);
    }

    // Fungsi untuk menampilkan status terjemahan (Updated for new UI)
    showTranslationStatus = () => {
        if (this.translationStatus) {
            this.translationStatus.classList.remove('hidden');
            // Check if using new progress bar style (has child elements) or old style
            if (!this.translationStatus.firstElementChild) {
                this.translationStatus.innerHTML = '<div class="text-center text-sm text-gray-400 py-2"><i class="fas fa-spinner fa-spin mr-2"></i>Menerjemahkan...</div>';
            }
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
            this.toggleListenButtons();

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

    translateDocument = async () => {
        if (!this.selectedFile) {
            this.showNotification('Pilih dokumen terlebih dahulu', 'warning');
            return;
        }

        const sourceLang = this.docFromLang;
        const targetLang = this.docToLang;

        if (!sourceLang || !targetLang) {
            this.showNotification('Pilih bahasa asal dan tujuan', 'warning');
            return;
        }

        if (this.isTranslating) {
            return;
        }

        this.isTranslating = true;

        // Update UI
        const originalText = this.translateDocBtn.innerHTML;
        this.translateDocBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menerjemahkan...';
        this.translateDocBtn.disabled = true;
        this.cancelUploadBtn.disabled = true;
        this.showNotification('Sedang menerjemahkan dokumen...', 'info');

        try {
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            formData.append('source_lang', sourceLang);
            formData.append('target_lang', targetLang);

            const response = await fetch(`${this.baseUrl}/translate-file`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errData = await response.json();
                    if (errData.error) errorMessage = errData.error;
                } catch (e) {
                    // Ignore JSON parse error if response is not JSON
                }
                throw new Error(errorMessage);
            }

            // Dapatkan file hasil terjemahan sebagai blob
            const blob = await response.blob();

            // Buat URL untuk blob
            const url = window.URL.createObjectURL(blob);

            // Ekstrak nama file asli dan ekstensi
            const originalName = this.selectedFile.name;
            const lastDotIndex = originalName.lastIndexOf('.');
            const nameWithoutExt = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
            const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';

            // Nama file baru (misal: dokumen_id_en.pdf)
            const newFileName = `${nameWithoutExt}_${sourceLang}_${targetLang}${ext}`;

            // Buat element <a> sementara untuk mengunduh
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = newFileName;
            document.body.appendChild(a);
            a.click();

            // Bersihkan
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showNotification('Dokumen berhasil diterjemahkan dan diunduh!', 'success');

            // Reset state
            this.cancelFileUpload();

        } catch (error) {
            console.error('Document translation error:', error);
            this.showNotification('Gagal menerjemahkan dokumen: ' + error.message, 'error');
        } finally {
            this.isTranslating = false;
            // Restore UI
            this.translateDocBtn.innerHTML = originalText;
            this.translateDocBtn.disabled = false;
            this.cancelUploadBtn.disabled = false;
        }
    }

    initSpeechRecognition = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            if (this.micInputBtn) {
                this.micInputBtn.style.display = 'none';
            }
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        let originalText = '';

        this.recognition.onstart = () => {
            this.isRecording = true;
            if (this.inputText) {
                originalText = this.inputText.value;
            }
            if (this.micInputBtn) {
                this.micInputBtn.classList.add('text-red-500', 'bg-red-50');
                this.micInputBtn.classList.remove('text-gray-500', 'hover:bg-gray-100');
                const icon = this.micInputBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-microphone');
                    icon.classList.add('fa-microphone-slash');
                }
            }
        };

        this.recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }
            if (this.inputText) {
                const space = originalText && !originalText.endsWith(' ') && currentTranscript ? ' ' : '';
                this.inputText.value = originalText + space + currentTranscript;
                this.autoTranslate();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.isRecording = false;
            this.resetMicButton();
            if (event.error !== 'no-speech') {
                this.showNotification('Gagal menggunakan mikrofon', 'error');
            }
        };

        this.recognition.onend = () => {
            this.isRecording = false;
            this.resetMicButton();
        };

        if (this.micInputBtn) {
            this.micInputBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.recognition.stop();
                } else {
                    try {
                        this.recognition.lang = this.fromLang;
                        this.recognition.start();
                    } catch (e) {
                        console.error('Error starting speech recognition:', e);
                    }
                }
            });
        }
    }

    resetMicButton = () => {
        if (this.micInputBtn) {
            this.micInputBtn.classList.remove('text-red-500', 'bg-red-50');
            this.micInputBtn.classList.add('text-gray-500', 'hover:bg-gray-100');
            const icon = this.micInputBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-microphone-slash');
                icon.classList.add('fa-microphone');
            }
        }
    }

    swapLanguages = () => {
        // swap codes
        [this.fromLang, this.toLang] = [this.toLang, this.fromLang];

        // swap text areas
        if (this.inputText && this.outputText) {
            [this.inputText.value, this.outputText.value] = [this.outputText.value, this.inputText.value];
            this.toggleListenButtons();
        }

        // swap labels/buttons (Updated for text spans)
        const fromBtn = document.getElementById('fromBtn');
        const toBtn = document.getElementById('toBtn');

        if (fromBtn && toBtn) {
            const fromSpan = fromBtn.querySelector('span.truncate') || fromBtn;
            const toSpan = toBtn.querySelector('span.truncate') || toBtn;

            // Swap text content
            const tempText = fromSpan.textContent;
            fromSpan.textContent = toSpan.textContent;
            toSpan.textContent = tempText;
        }

        // Auto-translate setelah swap jika ada teks
        if (this.inputText && this.inputText.value.trim()) {
            this.autoTranslate();
        }
    }

    // Fungsi untuk mengubah mode Terjemahan
    switchMode = (mode) => {
        const setActive = (btn) => {
            if (!btn) return;
            btn.classList.add('border-[#1a73e8]', 'bg-blue-50');
            btn.classList.remove('border-gray-200', 'bg-white', 'hover:bg-gray-50');

            const icon = btn.querySelector('.svg-icon');
            if (icon) {
                icon.classList.add('fill-[#1a73e8]');
                icon.classList.remove('fill-gray-600');
            }

            const title = btn.querySelector('.btn-title');
            if (title) {
                title.classList.add('text-[#1a73e8]');
                title.classList.remove('text-gray-700');
            }

            const subtitle = btn.querySelector('.btn-subtitle');
            if (subtitle) {
                subtitle.classList.add('text-[#1a73e8]', 'opacity-80');
                subtitle.classList.remove('text-gray-500');
            }
        };

        const setInactive = (btn) => {
            if (!btn) return;
            btn.classList.remove('border-[#1a73e8]', 'bg-blue-50');
            btn.classList.add('border-gray-200', 'bg-white', 'hover:bg-gray-50');

            const icon = btn.querySelector('.svg-icon');
            if (icon) {
                icon.classList.remove('fill-[#1a73e8]');
                icon.classList.add('fill-gray-600');
            }

            const title = btn.querySelector('.btn-title');
            if (title) {
                title.classList.remove('text-[#1a73e8]');
                title.classList.add('text-gray-700');
            }

            const subtitle = btn.querySelector('.btn-subtitle');
            if (subtitle) {
                subtitle.classList.remove('text-[#1a73e8]', 'opacity-80');
                subtitle.classList.add('text-gray-500');
            }
        };

        if (mode === 'text') {
            setActive(this.textModeBtn);
            setInactive(this.docModeBtn);

            if (this.textTranslationArea) this.textTranslationArea.classList.remove('hidden');
            if (this.docTranslationArea) {
                this.docTranslationArea.classList.add('hidden');
                this.docTranslationArea.classList.remove('flex');
            }
        } else if (mode === 'document') {
            setInactive(this.textModeBtn);
            setActive(this.docModeBtn);

            if (this.textTranslationArea) this.textTranslationArea.classList.add('hidden');
            if (this.docTranslationArea) {
                this.docTranslationArea.classList.remove('hidden');
                this.docTranslationArea.classList.add('flex');
            }
        }
    }

    handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Allow .txt, .pdf, .docx, .doc
        const allowedExtensions = ['.txt', '.pdf', '.docx', '.doc'];
        const fileNameStr = file.name.toLowerCase();
        const ext = fileNameStr.substring(fileNameStr.lastIndexOf('.'));

        if (!allowedExtensions.includes(ext)) {
            this.showNotification('Format dokumen tidak didukung', 'error');
            this.cancelFileUpload();
            return;
        }

        // Limit size, misalnya 5MB
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Ukuran dokumen terlalu besar (maks 5MB)', 'error');
            this.cancelFileUpload();
            return;
        }

        this.selectedFile = file;
        if (this.fileName) {
            this.fileName.textContent = file.name;
            this.fileName.title = file.name;
        }

        if (this.fileUploadState) {
            this.fileUploadState.classList.remove('hidden');
            this.fileUploadState.classList.add('flex');
        }
    }

    cancelFileUpload = () => {
        this.selectedFile = null;
        if (this.documentUploadInput) {
            this.documentUploadInput.value = '';
        }
        if (this.fileUploadState) {
            this.fileUploadState.classList.add('hidden');
            this.fileUploadState.classList.remove('flex');
        }
    }

    // Fungsi untuk text-to-speech
    speakText = (text, lang) => {
        if (!text || !text.trim()) {
            this.showNotification('Tidak ada teks untuk dibaca', 'warning');
            return;
        }

        // Pastikan Web Speech API didukung
        if (!('speechSynthesis' in window)) {
            this.showNotification('Browser Anda tidak mendukung fitur suara', 'error');
            return;
        }

        // Hentikan suara yang sedang berjalan sebelumnya
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Web Speech API menggunakan format seperti 'en-US' atau setidaknya 'en'
        // Beberapa browser mungkin butuh format spesifik, tapi kode 2 huruf biasanya berjalan baik (fallback otomatis)
        utterance.lang = lang;
        utterance.rate = this.voiceRate; // Menggunakan pengaturan kecepatan

        utterance.onerror = (e) => {
            console.error('SpeechSynthesis error:', e);
            if (e.error !== 'interrupted' && e.error !== 'canceled') {
                this.showNotification('Suara tidak tersedia untuk bahasa ini atau terjadi kesalahan.', 'warning');
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    // Fungsi untuk menyalin teks ke clipboard
    copyText = async (text) => {
        if (!text || !text.trim()) {
            this.showNotification('Tidak ada teks untuk disalin', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Teks disalin ke clipboard', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showNotification('Gagal menyalin teks', 'error');
        }
    }

    // Fungsi untuk menyembunyikan/menampilkan tombol aksi (speaker, copy, dll)
    toggleListenButtons = () => {
        const hasInputText = this.inputText && this.inputText.value.trim().length > 0;
        if (this.listenInputBtn) {
            if (hasInputText) this.listenInputBtn.classList.remove('hidden');
            else this.listenInputBtn.classList.add('hidden');
        }
        if (this.copyInputBtn) {
            if (hasInputText) this.copyInputBtn.classList.remove('hidden');
            else this.copyInputBtn.classList.add('hidden');
        }

        const hasOutputText = this.outputText && this.outputText.value.trim().length > 0;
        if (this.listenOutputBtn) {
            if (hasOutputText) this.listenOutputBtn.classList.remove('hidden');
            else this.listenOutputBtn.classList.add('hidden');
        }
        if (this.copyOutputBtn) {
            if (hasOutputText) this.copyOutputBtn.classList.remove('hidden');
            else this.copyOutputBtn.classList.add('hidden');
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