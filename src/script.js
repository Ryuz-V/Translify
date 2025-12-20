 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const sourceText = document.getElementById('sourceText');
            const translationResult = document.getElementById('translationResult');
            const translateBtn = document.getElementById('translateBtn');
            const translateSpinner = document.getElementById('translateSpinner');
            const translateIcon = document.getElementById('translateIcon');
            const clearAllBtn = document.getElementById('clearAllBtn');
            const clearSource = document.getElementById('clearSource');
            const copyTranslation = document.getElementById('copyTranslation');
            const swapLanguages = document.getElementById('swapLanguages');
            const sourceLang = document.getElementById('sourceLang');
            const targetLang = document.getElementById('targetLang');
            const sourceCharCount = document.getElementById('sourceCharCount');
            const translatedCharCount = document.getElementById('translatedCharCount');
            const pasteText = document.getElementById('pasteText');
            const speakSource = document.getElementById('speakSource');
            const sampleText = document.getElementById('sampleText');
            const speakTranslation = document.getElementById('speakTranslation');
            const saveTranslation = document.getElementById('saveTranslation');
            const shareTranslation = document.getElementById('shareTranslation');
            
            // Character counter update
            function updateCharCount() {
                const sourceCount = sourceText.value.length;
                sourceCharCount.textContent = `${sourceCount} karakter`;
                
                const translatedText = translationResult.textContent;
                const translatedCount = translatedText.length;
                translatedCharCount.textContent = `${translatedCount} karakter`;
            }
            
            // Initial character count
            updateCharCount();
            
            // Update character count on input
            sourceText.addEventListener('input', updateCharCount);
            
            // Sample translations for demo
            const sampleTranslations = {
                'id-en': `Hello! Welcome to the text translation tool.

Example text to translate:
Translation is the process of converting text from a source language to a target language. This process requires an in-depth understanding of contextual meaning, cultural terms, and language nuances.

You can replace this text with your own.`,
                'id-es': `¡Hola! Bienvenido a la herramienta de traducción de texto.

Texto de ejemplo para traducir:
La traducción es el proceso de convertir texto de un idioma de origen a un idioma de destino. Este proceso requiere una comprensión profunda del significado contextual, los términos culturales y los matices del lenguaje.

Puede reemplazar este texto con el suyo.`,
                'id-fr': `Bonjour ! Bienvenue dans l'outil de traduction de texte.

Exemple de texte à traduire :
La traduction est le processus de conversion d'un texte d'une langue source vers une langue cible. Ce processus nécessite une compréhension approfondie du sens contextuel, des termes culturels et des nuances linguistiques.

Vous pouvez remplacer ce texte par le vôtre.`,
                'id-de': `Hallo! Willkommen beim Textübersetzungstool.

Beispieltext zum Übersetzen:
Übersetzung ist der Prozess der Umwandlung von Text von einer Ausgangssprache in eine Zielsprache. Dieser Prozess erfordert ein tiefes Verständnis der kontextuellen Bedeutung, kultureller Begriffe und sprachlicher Nuancen.

Sie können diesen Text durch Ihren eigenen ersetzen.`
            };
            
            // Translation function (simulated)
            function translateText() {
                const text = sourceText.value.trim();
                
                if (!text) {
                    showNotification('Masukkan teks terlebih dahulu', 'warning');
                    return;
                }
                
                // Show loading spinner
                translateSpinner.classList.remove('hidden');
                translateIcon.classList.add('hidden');
                translateBtn.disabled = true;
                
                // Get selected languages
                const source = sourceLang.value;
                const target = targetLang.value;
                
                // Simulate API delay
                setTimeout(() => {
                    // Check if we have a sample translation for this language pair
                    const translationKey = `${source}-${target}`;
                    
                    if (sampleTranslations[translationKey]) {
                        translationResult.innerHTML = `<div class="text-gray-800 whitespace-pre-line">${sampleTranslations[translationKey]}</div>`;
                    } else {
                        // Generate a simulated translation
                        let simulatedTranslation = text;
                        
                        // Add a language pair indicator
                        const sourceName = sourceLang.options[sourceLang.selectedIndex].text.split(' ')[0];
                        const targetName = targetLang.options[targetLang.selectedIndex].text.split(' ')[0];
                        
                        translationResult.innerHTML = `
                            <div class="text-gray-800 whitespace-pre-line">
                                ${simulatedTranslation}
                                
                                <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p class="text-sm text-blue-700">
                                        <i class="fas fa-info-circle mr-1"></i>
                                        Ini adalah simulasi terjemahan dari <span class="font-semibold">${sourceName}</span> ke <span class="font-semibold">${targetName}</span>.
                                        Dalam implementasi nyata, ini akan terhubung ke API terjemahan seperti Google Translate.
                                    </p>
                                </div>
                            </div>
                        `;
                    }
                    
                    // Hide loading spinner
                    translateSpinner.classList.add('hidden');
                    translateIcon.classList.remove('hidden');
                    translateBtn.disabled = false;
                    
                    // Update character count
                    updateCharCount();
                    
                    // Show success notification
                    showNotification('Teks berhasil diterjemahkan', 'success');
                }, 1500);
            }
            
            // Clear all text
            function clearAllText() {
                sourceText.value = '';
                translationResult.innerHTML = `
                    <div class="flex items-center justify-center h-full">
                        <div class="text-center text-gray-500">
                            <i class="fas fa-language text-4xl mb-4"></i>
                            <p>Hasil terjemahan akan muncul di sini</p>
                            <p class="text-sm mt-2">Klik tombol "Terjemahkan" untuk memulai</p>
                        </div>
                    </div>
                `;
                updateCharCount();
                showNotification('Semua teks telah dihapus', 'info');
            }
            
            // Clear source text only
            function clearSourceText() {
                sourceText.value = '';
                updateCharCount();
                showNotification('Teks sumber telah dihapus', 'info');
            }
            
            // Copy translation to clipboard
            function copyToClipboard() {
                const textToCopy = translationResult.textContent.trim();
                
                if (!textToCopy || textToCopy.includes('Hasil terjemahan akan muncul di sini')) {
                    showNotification('Tidak ada terjemahan untuk disalin', 'warning');
                    return;
                }
                
                navigator.clipboard.writeText(textToCopy)
                    .then(() => {
                        // Visual feedback
                        const originalIcon = copyTranslation.innerHTML;
                        copyTranslation.innerHTML = '<i class="fas fa-check"></i>';
                        copyTranslation.classList.add('text-green-500');
                        
                        setTimeout(() => {
                            copyTranslation.innerHTML = originalIcon;
                            copyTranslation.classList.remove('text-green-500');
                        }, 2000);
                        
                        showNotification('Terjemahan berhasil disalin ke clipboard', 'success');
                    })
                    .catch(err => {
                        console.error('Gagal menyalin: ', err);
                        showNotification('Gagal menyalin teks', 'error');
                    });
            }
            
            // Swap languages
            function swapLanguages() {
                const sourceValue = sourceLang.value;
                const targetValue = targetLang.value;
                
                sourceLang.value = targetValue;
                targetLang.value = sourceValue;
                
                // Also swap the text if there's content
                const sourceTextValue = sourceText.value;
                const translatedText = translationResult.textContent.trim();
                
                if (sourceTextValue && !translatedText.includes('Hasil terjemahan akan muncul di sini')) {
                    sourceText.value = translatedText;
                    translationResult.innerHTML = `
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center text-gray-500">
                                <i class="fas fa-language text-4xl mb-4"></i>
                                <p>Hasil terjemahan akan muncul di sini</p>
                                <p class="text-sm mt-2">Klik tombol "Terjemahkan" untuk memulai</p>
                            </div>
                        </div>
                    `;
                    updateCharCount();
                }
                
                showNotification('Bahasa sumber dan target telah ditukar', 'info');
            }
            
            // Paste text from clipboard
            async function pasteFromClipboard() {
                try {
                    const text = await navigator.clipboard.readText();
                    sourceText.value = text;
                    updateCharCount();
                    showNotification('Teks berhasil ditempel', 'success');
                } catch (err) {
                    console.error('Gagal membaca clipboard: ', err);
                    showNotification('Gagal membaca clipboard', 'error');
                }
            }
            
            // Text-to-speech for source text
            function speakSourceText() {
                const text = sourceText.value.trim();
                
                if (!text) {
                    showNotification('Tidak ada teks untuk dibacakan', 'warning');
                    return;
                }
                
                // For demo, we'll just show a notification
                showNotification('Fitur text-to-speech akan diaktifkan', 'info');
                
                // In a real implementation, you would use the Web Speech API:
                // const utterance = new SpeechSynthesisUtterance(text);
                // speechSynthesis.speak(utterance);
            }
            
            // Load sample text
            function loadSampleText() {
                const sample = `Penerjemahan mesin (Machine Translation) adalah proses otomatis yang menggunakan perangkat lunak untuk menerjemahkan teks dari satu bahasa ke bahasa lainnya.

Teknologi ini telah berkembang pesat dalam beberapa tahun terakhir berkat kemajuan dalam kecerdasan buatan dan pembelajaran mendalam (deep learning).

Penerjemahan mesin statistik (SMT) dan penerjemahan mesin neural (NMT) adalah dua pendekatan utama yang digunakan saat ini. NMT umumnya menghasilkan terjemahan yang lebih alami dan akurat.

Meskipun demikian, terjemahan manusia masih diperlukan untuk teks-teks yang memerlukan nuansa budaya, konteks khusus, atau tingkat akurasi yang sangat tinggi.`;
                
                sourceText.value = sample;
                updateCharCount();
                showNotification('Contoh teks telah dimuat', 'success');
            }
            
            // Text-to-speech for translation
            function speakTranslationText() {
                const text = translationResult.textContent.trim();
                
                if (!text || text.includes('Hasil terjemahan akan muncul di sini')) {
                    showNotification('Tidak ada terjemahan untuk dibacakan', 'warning');
                    return;
                }
                
                // For demo, we'll just show a notification
                showNotification('Fitur text-to-speech akan diaktifkan untuk terjemahan', 'info');
            }
            
            // Save translation
            function saveTranslationToFile() {
                const text = translationResult.textContent.trim();
                
                if (!text || text.includes('Hasil terjemahan akan muncul di sini')) {
                    showNotification('Tidak ada terjemahan untuk disimpan', 'warning');
                    return;
                }
                
                // For demo, we'll just show a notification
                showNotification('Terjemahan telah disimpan (simulasi)', 'success');
                
                // In a real implementation, you would create and download a file:
                // const blob = new Blob([text], { type: 'text/plain' });
                // const url = URL.createObjectURL(blob);
                // const a = document.createElement('a');
                // a.href = url;
                // a.download = 'terjemahan.txt';
                // a.click();
                // URL.revokeObjectURL(url);
            }
            
            // Share translation
            function shareTranslation() {
                const text = translationResult.textContent.trim();
                
                if (!text || text.includes('Hasil terjemahan akan muncul di sini')) {
                    showNotification('Tidak ada terjemahan untuk dibagikan', 'warning');
                    return;
                }
                
                // For demo, we'll just show a notification
                showNotification('Fitur berbagi akan diaktifkan', 'info');
                
                // In a real implementation with Web Share API:
                // if (navigator.share) {
                //     navigator.share({
                //         title: 'Hasil Terjemahan',
                //         text: text.substring(0, 100) + '...',
                //         url: window.location.href
                //     });
                // }
            }
            
            // Show notification
            function showNotification(message, type) {
                // Remove existing notification
                const existingNotification = document.querySelector('.notification-toast');
                if (existingNotification) {
                    existingNotification.remove();
                }
                
                // Create notification element
                const notification = document.createElement('div');
                notification.className = `notification-toast fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 ${
                    type === 'success' ? 'bg-green-500' :
                    type === 'error' ? 'bg-red-500' :
                    type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`;
                notification.textContent = message;
                
                // Add icon based on type
                const icon = document.createElement('i');
                icon.className = `fas mr-3 ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'
                }`;
                notification.prepend(icon);
                
                // Add to document
                document.body.appendChild(notification);
                
                // Auto remove after 3 seconds
                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateX(100%)';
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, 3000);
            }
            
            // Event Listeners
            translateBtn.addEventListener('click', translateText);
            clearAllBtn.addEventListener('click', clearAllText);
            clearSource.addEventListener('click', clearSourceText);
            copyTranslation.addEventListener('click', copyToClipboard);
            swapLanguages.addEventListener('click', swapLanguages);
            pasteText.addEventListener('click', pasteFromClipboard);
            speakSource.addEventListener('click', speakSourceText);
            sampleText.addEventListener('click', loadSampleText);
            speakTranslation.addEventListener('click', speakTranslationText);
            saveTranslation.addEventListener('click', saveTranslationToFile);
            shareTranslation.addEventListener('click', shareTranslation);
            
            // Auto-translate on Enter key (Ctrl+Enter or Cmd+Enter)
            sourceText.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    translateText();
                }
            });
            
            // Auto-translate when text is pasted
            sourceText.addEventListener('paste', (e) => {
                // Wait for paste to complete
                setTimeout(() => {
                    if (sourceText.value.length > 50) {
                        translateText();
                    }
                }, 100);
            });
        }); 