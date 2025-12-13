/**
 * Multi-Profile & Team Mode Functions
 * Unterstützt mehrere Benutzerprofile mit lokaler Persistierung
 */

const STORAGE_KEY_PROFILES = 'timetracker_profiles';
const STORAGE_KEY_ACTIVE_PROFILE = 'timetracker_active_profile';

/**
 * Erstellt ein neues Profil
 * @param {string} name - Profil-Name
 * @param {Object} settings - Profil-Einstellungen {workHoursPerDay, color, team}
 * @returns {Object} Neues Profil mit ID und Zeitstempel
 */
export function createProfile(name, settings = {}) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Profile name is required and must be a non-empty string');
  }

  const profile = {
    id: generateId(),
    name: name.trim(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    entries: [],
    settings: {
      workHoursPerDay: settings.workHoursPerDay || 8,
      color: settings.color || '#a855f7',
      team: settings.team || null,
      timezone: settings.timezone || 'Europe/Berlin',
      ...settings
    }
  };

  return profile;
}

/**
 * Generiert eine eindeutige ID (UUID-ähnlich)
 * @returns {string} Eindeutige ID
 */
function generateId() {
  return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Speichert alle Profile im localStorage
 * @param {Array} profiles - Array von Profil-Objekten
 * @returns {boolean} true wenn erfolgreich
 */
export function saveProfiles(profiles) {
  if (!Array.isArray(profiles)) {
    throw new Error('Profiles must be an array');
  }

  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    return true;
  } catch (e) {
    console.error('Failed to save profiles:', e);
    return false;
  }
}

/**
 * Lädt alle Profile aus localStorage
 * @returns {Array} Array von Profil-Objekten oder leeres Array
 */
export function loadProfiles() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROFILES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load profiles:', e);
    return [];
  }
}

/**
 * Fügt ein neues Profil hinzu oder aktualisiert es
 * @param {Object} profile - Profil-Objekt
 * @returns {boolean} true wenn erfolgreich
 */
export function upsertProfile(profile) {
  if (!profile || !profile.id || !profile.name) {
    throw new Error('Profile must have id and name');
  }

  const profiles = loadProfiles();
  const existing = profiles.findIndex(p => p.id === profile.id);

  const updated = { ...profile, updated: new Date().toISOString() };

  if (existing >= 0) {
    profiles[existing] = updated;
  } else {
    profiles.push(updated);
  }

  return saveProfiles(profiles);
}

/**
 * Löscht ein Profil
 * @param {string} profileId - Profil-ID zum Löschen
 * @returns {boolean} true wenn erfolgreich
 */
export function deleteProfile(profileId) {
  const profiles = loadProfiles();
  const filtered = profiles.filter(p => p.id !== profileId);

  if (filtered.length === profiles.length) {
    throw new Error(`Profile with id ${profileId} not found`);
  }

  // Wenn gelöschtes Profil aktiv war, setze auf null
  const activeId = getActiveProfileId();
  if (activeId === profileId) {
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_PROFILE);
    } catch (e) {
      console.error('Failed to clear active profile:', e);
    }
  }

  return saveProfiles(filtered);
}

/**
 * Holt ein Profil nach ID
 * @param {string} profileId - Profil-ID
 * @returns {Object} Profil-Objekt oder null
 */
export function getProfile(profileId) {
  const profiles = loadProfiles();
  return profiles.find(p => p.id === profileId) || null;
}

/**
 * Setzt das aktive Profil
 * @param {string} profileId - Profil-ID zum Aktivieren
 * @returns {boolean} true wenn erfolgreich
 */
export function setActiveProfileId(profileId) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error(`Profile with id ${profileId} not found`);
  }

  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_PROFILE, profileId);
    return true;
  } catch (e) {
    console.error('Failed to set active profile:', e);
    return false;
  }
}

/**
 * Holt die ID des aktiven Profils
 * @returns {string} Aktive Profil-ID oder null
 */
export function getActiveProfileId() {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_PROFILE);
}

/**
 * Holt das aktive Profil-Objekt
 * @returns {Object} Aktives Profil oder null
 */
export function getActiveProfile() {
  const activeId = getActiveProfileId();
  return activeId ? getProfile(activeId) : null;
}

/**
 * Addiert einen Timer-Eintrag zu einem Profil
 * @param {string} profileId - Profil-ID
 * @param {Object} entry - Timer-Eintrag
 * @returns {boolean} true wenn erfolgreich
 */
export function addEntryToProfile(profileId, entry) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error(`Profile with id ${profileId} not found`);
  }

  if (!entry || !entry.id) {
    throw new Error('Entry must have an id');
  }

  profile.entries = profile.entries || [];
  profile.entries.push({ ...entry, addedAt: new Date().toISOString() });

  return upsertProfile(profile);
}

/**
 * Entfernt einen Eintrag aus einem Profil
 * @param {string} profileId - Profil-ID
 * @param {string} entryId - Eintrags-ID
 * @returns {boolean} true wenn erfolgreich
 */
export function removeEntryFromProfile(profileId, entryId) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error(`Profile with id ${profileId} not found`);
  }

  profile.entries = (profile.entries || []).filter(e => e.id !== entryId);

  return upsertProfile(profile);
}

/**
 * Exportiert alle Profil-Daten als JSON (Backup)
 * @returns {string} JSON-String mit allen Profilen
 */
export function exportAllProfiles() {
  const profiles = loadProfiles();
  const activeId = getActiveProfileId();

  const backup = {
    version: '2.1.1',
    exported: new Date().toISOString(),
    activeProfileId: activeId,
    profiles: profiles,
    totalProfiles: profiles.length,
    totalEntries: profiles.reduce((sum, p) => sum + (p.entries ? p.entries.length : 0), 0)
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Importiert Profile-Daten aus JSON
 * @param {string} jsonString - JSON-String zum Importieren
 * @param {boolean} merge - true = zusammenführen, false = ersetzen
 * @returns {Object} {success, importedCount, errors}
 */
export function importProfiles(jsonString, merge = true) {
  const errors = [];

  try {
    const data = JSON.parse(jsonString);

    if (!Array.isArray(data.profiles)) {
      errors.push('Invalid format: profiles must be an array');
      return { success: false, importedCount: 0, errors };
    }

    let currentProfiles = merge ? loadProfiles() : [];
    const imported = data.profiles.filter(p => {
      if (!p.id || !p.name) {
        errors.push(`Invalid profile: missing id or name`);
        return false;
      }
      return true;
    });

    // Merge oder Replace
    if (merge) {
      imported.forEach(newProfile => {
        const idx = currentProfiles.findIndex(p => p.id === newProfile.id);
        if (idx >= 0) {
          currentProfiles[idx] = newProfile;
        } else {
          currentProfiles.push(newProfile);
        }
      });
    } else {
      currentProfiles = imported;
    }

    saveProfiles(currentProfiles);

    if (data.activeProfileId) {
      setActiveProfileId(data.activeProfileId);
    }

    return {
      success: true,
      importedCount: imported.length,
      errors
    };
  } catch (e) {
    return {
      success: false,
      importedCount: 0,
      errors: [`JSON Parse Error: ${e.message}`]
    };
  }
}

/**
 * Listet alle Profil-Namen und IDs
 * @returns {Array} [{id, name, entryCount}]
 */
export function listProfiles() {
  return loadProfiles().map(p => ({
    id: p.id,
    name: p.name,
    entryCount: (p.entries || []).length,
    created: p.created,
    color: p.settings?.color || '#a855f7'
  }));
}

/**
 * Sucht Profile nach Name (Substring-Match)
 * @param {string} query - Suchterm
 * @returns {Array} Gefundene Profile
 */
export function searchProfiles(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  return loadProfiles().filter(p =>
    p.name.toLowerCase().includes(lowerQuery)
  );
}
