/**
 * SUPABASE KONFIGURATION - BEISPIEL
 * 
 * Für lokale Entwicklung:
 * 1. Kopiere diese Datei zu "supabase-config.js"
 * 2. Ersetze ANON_KEY mit deinem echten API Key von Supabase
 * 3. supabase-config.js wird NICHT zu GitHub gepusht (.gitignore)
 * 4. Lade die Datei NACH dem Supabase CDN Script
 */

// Supabase Konfiguration
const SUPABASE_CONFIG = {
    URL: 'https://fouucibowmukxvweratn.supabase.co',
    ANON_KEY: 'YOUR_ANON_KEY_HERE' // Ersetze mit deinem echten Key
};

// Initialisiere den Cloud Sync nach DOM-Load
document.addEventListener('DOMContentLoaded', () => {
    if (typeof SupabaseCloudSync !== 'undefined') {
        window.cloudSync = new SupabaseCloudSync(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        );
        
        console.log('[Init] Supabase Cloud Sync wurde initialisiert');
    }
});
