/**
 * Backup & Storage Core Functions
 * Zentrale Backup/Export/Import Logik für Tests
 */

/**
 * Exportiert Timer-Daten als JSON
 * @param {Array} entries - Liste der Timer-Einträge
 * @returns {string} JSON-String
 */
export function exportAsJSON(entries) {
  if (!Array.isArray(entries)) {
    throw new Error('Entries must be an array');
  }

  const backup = {
    version: '2.1.1',
    exported: new Date().toISOString(),
    entries: entries,
    totalCount: entries.length,
    totalHours: entries.reduce((sum, e) => sum + (e.duration || 0), 0) / 3600000
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Importiert JSON-Daten und validiert sie
 * @param {string} jsonString - JSON-String zum Importieren
 * @returns {Object} {success, data, errors}
 */
export function importFromJSON(jsonString) {
  const errors = [];
  
  try {
    const data = JSON.parse(jsonString);
    
    if (!Array.isArray(data.entries)) {
      errors.push('Invalid format: entries must be an array');
      return { success: false, data: null, errors };
    }

    // Validiere jeden Entry
    data.entries.forEach((entry, idx) => {
      if (!entry.id || !entry.date) {
        errors.push(`Entry ${idx}: Missing id or date`);
      }
      if (typeof entry.duration !== 'number' || entry.duration < 0) {
        errors.push(`Entry ${idx}: Invalid duration`);
      }
    });

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? data : null,
      errors
    };
  } catch (e) {
    return {
      success: false,
      data: null,
      errors: [`JSON Parse Error: ${e.message}`]
    };
  }
}

/**
 * Exportiert Daten als CSV
 * @param {Array} entries - Timer-Einträge
 * @returns {string} CSV-String
 */
export function exportAsCSV(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 'id,date,duration(h),category,notes\n';
  }

  const header = 'id,date,duration(h),category,notes\n';
  const rows = entries.map(e => {
    const durationHours = ((e.duration || 0) / 3600000).toFixed(2);
    const notes = (e.notes || '').replace(/,/g, ';'); // Escape commas
    return `"${e.id}","${e.date}","${durationHours}","${e.category || 'unknown'}","${notes}"`;
  });

  return header + rows.join('\n');
}

/**
 * Speichert Daten im localStorage
 * @param {string} key - Storage-Key
 * @param {any} value - Zu speichernder Wert
 * @returns {boolean} true wenn erfolgreich
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Storage save failed:', e);
    return false;
  }
}

/**
 * Lädt Daten aus localStorage
 * @param {string} key - Storage-Key
 * @returns {any} Geladener Wert oder null
 */
export function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Storage load failed:', e);
    return null;
  }
}

/**
 * Validiert Backup-Struktur
 * @param {Object} backup - Backup-Objekt
 * @returns {Object} {isValid, errors}
 */
export function validateBackup(backup) {
  const errors = [];

  if (!backup || typeof backup !== 'object') {
    errors.push('Backup must be an object');
  } else {
    if (!backup.version) errors.push('Missing version');
    if (!backup.exported) errors.push('Missing exported timestamp');
    if (!Array.isArray(backup.entries)) errors.push('Entries must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
