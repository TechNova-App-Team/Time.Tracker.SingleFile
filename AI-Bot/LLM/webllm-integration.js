/**
 * WebLLM Integration v1.0
 * Ermöglicht Umschaltung zwischen lokalem AI-Bot und browsergestütztem WebLLM
 * Mit IndexedDB Caching und Ladebalken-UI
 */

class WebLLMIntegration {
    constructor() {
        this.engine = null;
        this.isLoading = false;
        this.isWebLLMActive = false;
        // Nutze Config wenn verfügbar, sonst Fallback
        this.model = (typeof WebLLMConfig !== 'undefined' && WebLLMConfig.model) 
            ? WebLLMConfig.model 
            : 'Llama-3.2-1B-Instruct-q4f32_1-MLC';
        this.conversationHistory = [];
        this.loadState();
        this.logDebug('WebLLM Integration initialisiert');
    }

    /**
     * Debug-Logging (wenn aktiviert)
     */
    logDebug(message, data = null) {
        const debug = typeof WebLLMConfig !== 'undefined' && WebLLMConfig.debug;
        if (debug) {
            console.log('[WebLLM Debug]', message, data || '');
        }
    }

    /**
     * Lädt den State aus localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('webllm_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.isWebLLMActive = state.isActive;
                this.conversationHistory = state.history || [];
            }
        } catch (e) {
            console.warn('[WebLLM] Fehler beim Laden des States:', e);
        }
    }

    /**
     * Speichert den aktuellen State
     */
    saveState() {
        localStorage.setItem('webllm_state', JSON.stringify({
            isActive: this.isWebLLMActive,
            history: this.conversationHistory
        }));
    }

    /**
     * Zeigt ein Warnung-Modal vor dem Laden von WebLLM
     */
    showWarningModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'webllm-warning-modal';
            modal.innerHTML = `
                <div class="webllm-modal-overlay" onclick="if(event.target === this) this.parentElement.remove()"></div>
                <div class="webllm-modal-box">
                    <div class="webllm-modal-header">
                        <h2>⚠️ WebLLM aktivieren?</h2>
                        <button class="webllm-close-btn" onclick="this.closest('.webllm-warning-modal').remove()">×</button>
                    </div>
                    <div class="webllm-modal-content">
                        <p>Beim ersten Laden werden etwa <strong>800 MB</strong> Daten in den Browser-Cache heruntergeladen.</p>
                        <ul>
                            <li>⏱️ Erstes Laden: 2-5 Minuten</li>
                            <li>📦 Speicherverbrauch: ~800 MB</li>
                            <li>💻 CPU-intensive Verarbeitung</li>
                            <li>✅ Danach im lokalen Cache verfügbar</li>
                        </ul>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 1rem;">
                            Das Modell bleibt nach dem Laden im IndexedDB Cache, sodass es beim nächsten Besuch viel schneller startet.
                        </p>
                    </div>
                    <div class="webllm-modal-actions">
                        <button class="webllm-btn-secondary" onclick="this.closest('.webllm-warning-modal').remove()">
                            Abbrechen
                        </button>
                        <button class="webllm-btn-primary" id="webllmConfirmBtn">
                            Ja, aktivieren
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('webllmConfirmBtn').onclick = () => {
                modal.remove();
                resolve(true);
            };

            // Falls Modal geschlossen wird
            modal.querySelector('.webllm-close-btn').onclick = () => {
                resolve(false);
            };

            modal.querySelector('.webllm-modal-overlay').onclick = (e) => {
                if (e.target === modal.querySelector('.webllm-modal-overlay')) {
                    resolve(false);
                }
            };
        });
    }

    /**
     * Zeigt einen Ladebalken während WebLLM geladen wird
     */
    showLoadingBar() {
        const container = document.createElement('div');
        container.id = 'webllm-loading-container';
        container.className = 'webllm-loading-container';
        container.innerHTML = `
            <div class="webllm-loading-box">
                <div class="webllm-loading-icon">🚀</div>
                <h3>WebLLM wird geladen...</h3>
                <p id="webllm-loading-status">Modell wird heruntergeladen...</p>
                <div class="webllm-progress-bar">
                    <div class="webllm-progress-fill" id="webllm-progress"></div>
                </div>
                <p class="webllm-progress-text">
                    <span id="webllm-progress-percent">0%</span> • 
                    <span id="webllm-loading-time">0s</span>
                </p>
            </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    /**
     * Aktualisiert den Ladebalken
     */
    updateProgress(percent, message = null) {
        const bar = document.getElementById('webllm-progress');
        const percentText = document.getElementById('webllm-progress-percent');

        if (bar) bar.style.width = percent + '%';
        if (percentText) percentText.textContent = Math.round(percent) + '%';
        if (message) {
            const status = document.getElementById('webllm-loading-status');
            if (status) status.textContent = message;
        }
    }

    /**
     * Entfernt den Ladebalken
     */
    removeLoadingBar() {
        const container = document.getElementById('webllm-loading-container');
        if (container) {
            container.style.opacity = '0';
            setTimeout(() => container.remove(), 300);
        }
    }

    /**
     * Lädt WebLLM und initialisiert das Modell
     */
    async loadWebLLM() {
        if (this.isLoading || this.isWebLLMActive) return;

        const confirmed = await this.showWarningModal();
        if (!confirmed) return;

        this.isLoading = true;
        const startTime = Date.now();
        this.showLoadingBar();

        try {
            // Lade WebLLM Bibliothek mit Fallback URLs
            if (!window.mlc) {
                this.updateProgress(10, 'Läde WebLLM Bibliothek...');
                
                // Moderne CDN URLs für WebLLM v0.2.80+
                const cdnUrls = [
                    'https://esm.run/@mlc-ai/web-llm@0.2.80',      // ESM Hauptadresse (zuverlässig)
                    'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.80/+esm',  // jsdelivr ESM
                    'https://unpkg.com/@mlc-ai/web-llm@0.2.80/+esm', // unpkg ESM Fallback
                ];
                
                let loaded = false;
                let lastError = null;
                
                for (const url of cdnUrls) {
                    try {
                        console.log('[WebLLM] Versuche zu laden:', url);
                        // Verwende dynamischen import für ESM URLs
                        if (url.includes('esm.run')) {
                            window.mlc = await import(url);
                            loaded = true;
                            break;
                        } else {
                            await this.loadScript(url);
                            loaded = true;
                            break;
                        }
                    } catch (err) {
                        console.warn('[WebLLM] CDN fehlgeschlagen:', url, err.message);
                        lastError = err;
                    }
                }
                
                if (!loaded) {
                    throw new Error('WebLLM Library konnte von keiner CDN geladen werden. Prüfe deine Internet-Verbindung!');
                }
            }

            this.updateProgress(30, 'Initialisiere Modell...');

            // Prüfe ob MLCEngine verfügbar ist
            if (!window.mlc || !window.mlc.CreateMLCEngine) {
                throw new Error('WebLLM Library wurde geladen, aber CreateMLCEngine ist nicht verfügbar. Browser könnte nicht kompatibel sein.');
            }

            // Initialisiere MLCEngine mit Model Loading
            const { CreateMLCEngine } = window.mlc;
            
            // Progress Callback für Loading
            const initProgressCallback = (progress) => {
                const percent = Math.round(progress.progress * 100);
                const message = `Lädt Modell: ${progress.text || 'Initialisierung'}`;
                this.updateProgress(Math.min(99, 30 + (percent * 0.7)), message);
            };

            // Erstelle Engine und lade Modell
            this.engine = await CreateMLCEngine(
                this.model,
                { initProgressCallback },
                { temperature: 0.7, top_p: 0.95 }
            );

            this.updateProgress(100, 'WebLLM ist bereit!');
            this.isWebLLMActive = true;
            this.saveState();

            // Entferne Ladebalken nach kurzer Verzögerung
            setTimeout(() => {
                this.removeLoadingBar();
                this.showSuccessMessage();
                this.isLoading = false;
            }, 500);

        } catch (error) {
            console.error('[WebLLM] Fehler beim Laden:', error);
            this.removeLoadingBar();
            await this.showErrorMessage(error.message);
            this.isLoading = false;
        }
    }

    /**
     * Prüft Internet-Verbindung
     */
    async checkNetworkConnection() {
        try {
            const response = await fetch('https://www.google.com/favicon.ico', { 
                method: 'HEAD',
                mode: 'no-cors'
            });
            return true;
        } catch (err) {
            console.warn('[WebLLM] Netzwerk-Prüfung fehlgeschlagen:', err);
            return false;
        }
    }

    /**
     * Lädt ein externes Script
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log('[WebLLM] Script geladen:', src);
                resolve();
            };
            script.onerror = () => {
                const error = new Error(`Fehler beim Laden von ${src}. Prüfe Internet-Verbindung oder versuche später erneut.`);
                console.error('[WebLLM] Script-Fehler:', error);
                reject(error);
            };
            script.async = true;
            document.head.appendChild(script);
        });
    }

    /**
     * Generiert eine Antwort mit WebLLM
     */
    async generateResponse(userMessage) {
        if (!this.isWebLLMActive || !this.engine) {
            return 'WebLLM ist nicht aktiv. Bitte aktiviere es zuerst.';
        }

        try {
            // Basis-Prüfung: Hat engine die required methods?
            if (!this.engine.chat || !this.engine.chat.completions) {
                return '⚠️ Modell wird noch geladen. Bitte warten Sie...';
            }

            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Prepare prompt mit Konversationsverlauf
            const messages = this.conversationHistory.slice(-10); // Letzten 10 Messages

            // Generiere Antwort
            const response = await this.engine.chat.completions.create({
                messages: messages,
                max_tokens: 500,
                temperature: 0.7,
            });

            if (!response || !response.choices || response.choices.length === 0) {
                throw new Error('Keine gültige Antwort vom Modell erhalten');
            }

            const assistantMessage = response.choices[0].message.content;

            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            this.saveState();
            return assistantMessage;

        } catch (error) {
            console.error('[WebLLM] Fehler bei Antwortgenerierung:', error);
            
            // Bessere Fehlermeldungen
            let userMessage = '❌ Fehler bei der Antwortgenerierung: ';
            if (error.message.includes('Model not loaded')) {
                userMessage += 'Modell ist nicht geladen. Versuche WebLLM neu zu laden...';
            } else if (error.message.includes('out of memory')) {
                userMessage += 'Nicht genug Speicher. Schließe andere Tabs.';
            } else if (error.message.includes('timeout')) {
                userMessage += 'Anfrage hat zu lange gedauert. Versuche erneut.';
            } else {
                userMessage += error.message;
            }
            
            return userMessage;
        }
    }

    /**
     * Schaltet zwischen AI-Bot und WebLLM um
     */
    async toggleMode() {
        if (this.isWebLLMActive) {
            // Schalte zu lokalem Bot zurück
            this.isWebLLMActive = false;
            this.saveState();
            if (typeof showCustomMessage === 'function') {
                showCustomMessage('✅ Modus gewechselt', 'Zurück zum lokalen AI-Bot', 'success');
            }
            this.updateButtonState();
        } else {
            // Lade WebLLM
            await this.loadWebLLM();
            this.updateButtonState();
        }
    }

    /**
     * Aktualisiert den Button-Status
     */
    updateButtonState() {
        const btn = document.getElementById('webllm-toggle-btn');
        if (btn) {
            btn.classList.toggle('active', this.isWebLLMActive);
            btn.setAttribute('aria-pressed', this.isWebLLMActive);
            btn.textContent = this.isWebLLMActive ? '🧠 WebLLM (aktiv)' : '🤖 Lokaler Bot';
            btn.title = this.isWebLLMActive 
                ? 'Klick um zum lokalen AI-Bot zu wechseln' 
                : 'Klick um WebLLM zu aktivieren';
        }
    }

    /**
     * Zeigt Erfolgsmeldung an
     */
    showSuccessMessage() {
        if (typeof showCustomMessage === 'function') {
            showCustomMessage(
                '✅ WebLLM erfolgreich geladen',
                'Das Modell ist nun im Browser-Cache verfügbar und wird beim nächsten Besuch schneller geladen.',
                'success'
            );
        }
    }

    /**
     * Zeigt Fehlermeldung an
     */
    async showErrorMessage(error) {
        // Erstelle aussagekräftige Fehlermeldung
        let errorMsg = error || 'Unbekannter Fehler';
        
        if (typeof error === 'object') {
            errorMsg = error.message || error.toString();
        }
        
        // Gib freundliche Fehlermeldung aus
        let userMessage = this.getFriendlyErrorMessage(errorMsg);
        
        // Bei Netzwerk-Fehlern, prüfe Internet
        if (errorMsg.includes('CDN') || errorMsg.includes('laden')) {
            const hasNetwork = await this.checkNetworkConnection();
            if (!hasNetwork) {
                userMessage = '🌐 Keine Internet-Verbindung erkannt. Bitte verbinde dich mit dem Internet und versuche erneut.';
            } else {
                userMessage += '\n\n💡 Tipp: Die CDN-Server könnten überlastet sein. Versuche es in ein paar Minuten erneut.';
            }
        }
        
        if (typeof showCustomMessage === 'function') {
            showCustomMessage(
                '❌ Fehler beim Laden',
                userMessage,
                'danger'
            );
        } else {
            alert(`WebLLM Fehler: ${userMessage}`);
        }
        
        console.error('[WebLLM] Fehler:', errorMsg);
    }

    /**
     * Konvertiert technische Fehlermeldungen in benutzerfreundliche Texte
     */
    getFriendlyErrorMessage(error) {
        const msg = String(error).toLowerCase();
        
        if (msg.includes('cdn') || msg.includes('network') || msg.includes('fetch')) {
            return '🌐 Internet-Verbindung fehlgeschlagen. Prüfe deine Verbindung oder versuche es später.';
        }
        if (msg.includes('indexeddb') || msg.includes('storage')) {
            return '💾 Browser-Speicher nicht verfügbar. Prüfe Browser-Einstellungen.';
        }
        if (msg.includes('webassembly')) {
            return '⚠️ Dein Browser unterstützt WebAssembly nicht. Aktualisiere deinen Browser!';
        }
        if (msg.includes('memory') || msg.includes('ram')) {
            return '💥 Nicht genug Speicher. Schließe andere Tabs und versuche es erneut.';
        }
        if (msg.includes('timeout')) {
            return '⏱️ Das Laden hat zu lange gedauert. Versuche es später erneut.';
        }
        
        return error;
    }

    /**
     * Gibt den aktuellen Modus zurück
     */
    getMode() {
        return this.isWebLLMActive ? 'webllm' : 'local';
    }

    /**
     * Löscht die Konversationshistorie (NOT der Cache)
     * Wird aufgerufen wenn User den Chat cleared
     */
    clearConversation() {
        try {
            this.conversationHistory = [];
            this.saveState();
            console.log('[WebLLM] Konversationsverlauf gelöscht');
        } catch (error) {
            console.error('[WebLLM] Fehler beim Löschen der Konversation:', error);
        }
    }

    /**
     * Löscht den Cache
     */
    async clearCache() {
        try {
            if (this.engine) {
                await this.engine.detach();
                this.engine = null;
            }
            this.isWebLLMActive = false;
            this.saveState();
            if (typeof showCustomMessage === 'function') {
                showCustomMessage('✅ Cache gelöscht', 'WebLLM Cache wurde geleert.', 'success');
            }
        } catch (error) {
            console.error('[WebLLM] Fehler beim Löschen des Cache:', error);
        }
    }
}

// Globale Instanz
window.webLLMIntegration = new WebLLMIntegration();

// Exportiere für externe Verwendung
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebLLMIntegration;
}
