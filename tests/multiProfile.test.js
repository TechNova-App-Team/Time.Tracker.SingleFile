/**
 * Multi-Profile Mode Tests
 */

import {
  createProfile,
  saveProfiles,
  loadProfiles,
  upsertProfile,
  deleteProfile,
  getProfile,
  setActiveProfileId,
  getActiveProfileId,
  getActiveProfile,
  addEntryToProfile,
  removeEntryFromProfile,
  exportAllProfiles,
  importProfiles,
  listProfiles,
  searchProfiles
} from '../tests/multiProfileHelpers';

describe('Multi-Profile & Team Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('createProfile', () => {
    it('should create a new profile with required fields', () => {
      const profile = createProfile('John Doe');

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe('John Doe');
      expect(profile.created).toBeDefined();
      expect(profile.updated).toBeDefined();
      expect(profile.entries).toEqual([]);
    });

    it('should include default settings', () => {
      const profile = createProfile('Test User');

      expect(profile.settings.workHoursPerDay).toBe(8);
      expect(profile.settings.color).toBe('#a855f7');
      expect(profile.settings.timezone).toBe('Europe/Berlin');
    });

    it('should merge custom settings', () => {
      const profile = createProfile('Test', {
        workHoursPerDay: 6,
        color: '#ff0000',
        team: 'Team A'
      });

      expect(profile.settings.workHoursPerDay).toBe(6);
      expect(profile.settings.color).toBe('#ff0000');
      expect(profile.settings.team).toBe('Team A');
    });

    it('should throw error for invalid name', () => {
      expect(() => createProfile(null)).toThrow();
      expect(() => createProfile('')).toThrow();
      expect(() => createProfile('   ')).toThrow();
      expect(() => createProfile(123)).toThrow();
    });

    it('should generate unique IDs', () => {
      const p1 = createProfile('User 1');
      const p2 = createProfile('User 2');

      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe('Profile Storage & Retrieval', () => {
    it('should save and load profiles', () => {
      const profile1 = createProfile('User 1');
      const profile2 = createProfile('User 2');

      saveProfiles([profile1, profile2]);
      const loaded = loadProfiles();

      expect(loaded.length).toBe(2);
      expect(loaded[0].name).toBe('User 1');
      expect(loaded[1].name).toBe('User 2');
    });

    it('should return empty array if no profiles saved', () => {
      const loaded = loadProfiles();

      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded.length).toBe(0);
    });

    it('should get profile by ID', () => {
      const profile = createProfile('Test User');
      saveProfiles([profile]);

      const retrieved = getProfile(profile.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.name).toBe('Test User');
    });

    it('should return null for non-existent profile', () => {
      const result = getProfile('nonexistent_id');

      expect(result).toBeNull();
    });
  });

  describe('Upsert & Delete Profile', () => {
    it('should insert new profile via upsert', () => {
      const profile = createProfile('New User');

      upsertProfile(profile);
      const loaded = loadProfiles();

      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe(profile.id);
    });

    it('should update existing profile via upsert', () => {
      const profile = createProfile('Original Name');
      upsertProfile(profile);

      profile.name = 'Updated Name';
      upsertProfile(profile);

      const updated = getProfile(profile.id);

      expect(updated.name).toBe('Updated Name');
    });

    it('should delete profile by ID', () => {
      const p1 = createProfile('User 1');
      const p2 = createProfile('User 2');

      saveProfiles([p1, p2]);
      deleteProfile(p1.id);

      const loaded = loadProfiles();

      expect(loaded.length).toBe(1);
      expect(loaded[0].id).toBe(p2.id);
    });

    it('should throw error when deleting non-existent profile', () => {
      expect(() => deleteProfile('nonexistent')).toThrow();
    });
  });

  describe('Active Profile Management', () => {
    it('should set and get active profile ID', () => {
      const profile = createProfile('Active User');
      upsertProfile(profile);

      setActiveProfileId(profile.id);
      const activeId = getActiveProfileId();

      expect(activeId).toBe(profile.id);
    });

    it('should get active profile object', () => {
      const profile = createProfile('Active User');
      upsertProfile(profile);
      setActiveProfileId(profile.id);

      const active = getActiveProfile();

      expect(active.name).toBe('Active User');
    });

    it('should return null if no active profile set', () => {
      const active = getActiveProfile();

      expect(active).toBeNull();
    });

    it('should throw error when setting non-existent profile as active', () => {
      expect(() => setActiveProfileId('nonexistent')).toThrow();
    });

    it('should clear active profile when deleted', () => {
      const profile = createProfile('User');
      upsertProfile(profile);
      setActiveProfileId(profile.id);

      deleteProfile(profile.id);
      const activeId = getActiveProfileId();

      // Should be cleared or reassigned
      expect(activeId).not.toBe(profile.id);
    });
  });

  describe('Entry Management', () => {
    it('should add entry to profile', () => {
      const profile = createProfile('User');
      upsertProfile(profile);

      const entry = { id: 'e1', date: '2025-12-13', duration: 3600000 };
      addEntryToProfile(profile.id, entry);

      const updated = getProfile(profile.id);

      expect(updated.entries.length).toBe(1);
      expect(updated.entries[0].id).toBe('e1');
    });

    it('should remove entry from profile', () => {
      const profile = createProfile('User');
      profile.entries = [
        { id: 'e1', date: '2025-12-13', duration: 3600000 },
        { id: 'e2', date: '2025-12-13', duration: 1800000 }
      ];
      upsertProfile(profile);

      removeEntryFromProfile(profile.id, 'e1');

      const updated = getProfile(profile.id);

      expect(updated.entries.length).toBe(1);
      expect(updated.entries[0].id).toBe('e2');
    });

    it('should throw error for invalid profile in addEntry', () => {
      expect(() => addEntryToProfile('nonexistent', { id: 'e1' })).toThrow();
    });
  });

  describe('Export & Import', () => {
    it('should export all profiles as JSON', () => {
      const p1 = createProfile('User 1');
      const p2 = createProfile('User 2');
      saveProfiles([p1, p2]);
      setActiveProfileId(p1.id);

      const exported = exportAllProfiles();
      const parsed = JSON.parse(exported);

      expect(parsed.profiles.length).toBe(2);
      expect(parsed.activeProfileId).toBe(p1.id);
      expect(parsed.totalProfiles).toBe(2);
    });

    it('should import profiles (replace mode)', () => {
      const p1 = createProfile('User 1');
      upsertProfile(p1);

      const importData = {
        version: '2.1.1',
        exported: new Date().toISOString(),
        activeProfileId: null,
        profiles: [
          createProfile('Imported User')
        ]
      };

      const result = importProfiles(JSON.stringify(importData), false);

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(1);

      const loaded = loadProfiles();
      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('Imported User');
    });

    it('should import profiles (merge mode)', () => {
      const p1 = createProfile('User 1');
      upsertProfile(p1);

      const importData = {
        profiles: [createProfile('User 2')]
      };

      importProfiles(JSON.stringify(importData), true);

      const loaded = loadProfiles();

      expect(loaded.length).toBe(2);
    });

    it('should reject invalid import data', () => {
      const result = importProfiles(JSON.stringify({ profiles: 'invalid' }), false);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should list all profiles with summary', () => {
      const p1 = createProfile('User 1');
      p1.entries = [{ id: 'e1' }, { id: 'e2' }];
      upsertProfile(p1);

      const list = listProfiles();

      expect(list.length).toBe(1);
      expect(list[0].name).toBe('User 1');
      expect(list[0].entryCount).toBe(2);
    });

    it('should search profiles by name', () => {
      const p1 = createProfile('John Doe');
      const p2 = createProfile('Jane Smith');
      saveProfiles([p1, p2]);

      const results = searchProfiles('john');

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('John Doe');
    });

    it('should return empty for invalid search query', () => {
      const results = searchProfiles(null);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });
});
