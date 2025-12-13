/**
 * Backup Core Tests
 * Unit Tests für Backup/Export/Import-Funktionen
 */

import {
  exportAsJSON,
  importFromJSON,
  exportAsCSV,
  saveToStorage,
  loadFromStorage,
  validateBackup
} from '../tests/backupHelpers';

describe('Backup & Export Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('exportAsJSON', () => {
    it('should export entries as valid JSON', () => {
      const entries = [
        { id: '1', date: '2025-12-13', duration: 3600000, category: 'work' },
        { id: '2', date: '2025-12-13', duration: 7200000, category: 'school' }
      ];

      const result = exportAsJSON(entries);
      const parsed = JSON.parse(result);

      expect(parsed.version).toBe('2.1.1');
      expect(parsed.entries.length).toBe(2);
      expect(parsed.totalCount).toBe(2);
    });

    it('should calculate total hours correctly', () => {
      const entries = [
        { id: '1', duration: 3600000 }, // 1 hour
        { id: '2', duration: 7200000 }  // 2 hours
      ];

      const result = exportAsJSON(entries);
      const parsed = JSON.parse(result);

      expect(parsed.totalHours).toBe(3); // 3 hours total
    });

    it('should throw error for invalid input', () => {
      expect(() => exportAsJSON(null)).toThrow();
      expect(() => exportAsJSON('invalid')).toThrow();
      expect(() => exportAsJSON({})).toThrow();
    });

    it('should include export timestamp', () => {
      const entries = [];
      const result = exportAsJSON(entries);
      const parsed = JSON.parse(result);

      expect(parsed.exported).toBeDefined();
      expect(new Date(parsed.exported).getTime()).toBeGreaterThan(0);
    });
  });

  describe('importFromJSON', () => {
    it('should import valid JSON backup', () => {
      const backup = {
        version: '2.1.1',
        exported: new Date().toISOString(),
        entries: [
          { id: '1', date: '2025-12-13', duration: 3600000 }
        ]
      };

      const result = importFromJSON(JSON.stringify(backup));

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid JSON', () => {
      const result = importFromJSON('invalid json {');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate entries structure', () => {
      const backup = {
        entries: [
          { id: '1', date: '2025-12-13', duration: -100 } // Invalid: negative duration
        ]
      };

      const result = importFromJSON(JSON.stringify(backup));

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require entries array', () => {
      const backup = { version: '2.1.1' }; // Missing entries

      const result = importFromJSON(JSON.stringify(backup));

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid format: entries must be an array');
    });
  });

  describe('exportAsCSV', () => {
    it('should export entries as CSV', () => {
      const entries = [
        { id: '1', date: '2025-12-13', duration: 3600000, category: 'work', notes: 'Test' }
      ];

      const result = exportAsCSV(entries);

      expect(result).toContain('id,date,duration(h),category,notes');
      expect(result).toContain('"1"');
      expect(result).toContain('"1.00"'); // 1 hour in decimal
    });

    it('should handle empty entries', () => {
      const result = exportAsCSV([]);

      expect(result).toContain('id,date,duration(h),category,notes');
    });

    it('should escape commas in notes', () => {
      const entries = [
        { id: '1', date: '2025-12-13', duration: 0, notes: 'Note with, comma' }
      ];

      const result = exportAsCSV(entries);

      expect(result).toContain('Note with; comma');
    });
  });

  describe('Storage Functions', () => {
    it('should save and load from storage', () => {
      const testData = { key: 'value', count: 42 };

      saveToStorage('testKey', testData);
      const loaded = loadFromStorage('testKey');

      expect(loaded).toEqual(testData);
    });

    it('should return null for missing key', () => {
      const result = loadFromStorage('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle JSON serialization', () => {
      const complexData = {
        date: new Date().toISOString(),
        nested: { array: [1, 2, 3] }
      };

      saveToStorage('complex', complexData);
      const loaded = loadFromStorage('complex');

      expect(loaded.nested.array).toEqual([1, 2, 3]);
    });

    it('saveToStorage should return boolean status', () => {
      const result = saveToStorage('key', 'value');

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });
  });

  describe('validateBackup', () => {
    it('should validate correct backup structure', () => {
      const backup = {
        version: '2.1.1',
        exported: new Date().toISOString(),
        entries: []
      };

      const result = validateBackup(backup);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject incomplete backup', () => {
      const backup = { version: '2.1.1' }; // Missing other fields

      const result = validateBackup(backup);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require array for entries', () => {
      const backup = {
        version: '2.1.1',
        exported: new Date().toISOString(),
        entries: 'not an array'
      };

      const result = validateBackup(backup);

      expect(result.isValid).toBe(false);
    });
  });
});
