        document.getElementById('translationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                text: formData.get('source_text'),
                source_lang: formData.get('source_lang'),
                target_lang: formData.get('target_lang')
            };
            
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            document.getElementById('translationResult').innerHTML = 
                `<p class="text-gray-800">${result.translated_text || result.error}</p>`;
        });