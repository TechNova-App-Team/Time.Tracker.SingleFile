/**
 * Calendar & iCal Export Tests
 */

import {
  exportAsICSFile,
  groupEntriesByDate,
  generateMonthCalendar,
  calculateDateRangeStats
} from '../tests/calendarHelpers';

describe('Calendar & iCal Export Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEntries = [
    {
      id: '1',
      date: '2025-12-13',
      duration: 3600000,
      category: 'work',
      notes: 'Morning work session'
    },
    {
      id: '2',
      date: '2025-12-13',
      duration: 5400000,
      category: 'school',
      notes: 'Training'
    },
    {
      id: '3',
      date: '2025-12-12',
      duration: 7200000,
      category: 'work',
      notes: 'Afternoon work'
    }
  ];

  describe('exportAsICSFile', () => {
    it('should export entries as valid iCal format', () => {
      const result = exportAsICSFile(mockEntries);

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('END:VCALENDAR');
      expect(result).toContain('VERSION:2.0');
      expect(result).toContain('PRODID:-//TimeTracker//');
    });

    it('should include all valid events', () => {
      const result = exportAsICSFile(mockEntries);

      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('END:VEVENT');
      expect(result.match(/BEGIN:VEVENT/g).length).toBe(mockEntries.length);
    });

    it('should format event summaries with duration', () => {
      const result = exportAsICSFile(mockEntries);

      expect(result).toContain('Work:');
      expect(result).toContain('CATEGORIES:work');
      expect(result).toContain('CATEGORIES:school');
    });

    it('should handle custom username', () => {
      const result = exportAsICSFile(mockEntries, 'MaxMustermann');

      expect(result).toContain("X-WR-CALNAME:MaxMustermann's Time Tracker");
    });

    it('should throw error for invalid input', () => {
      expect(() => exportAsICSFile(null)).toThrow();
      expect(() => exportAsICSFile('invalid')).toThrow();
      expect(() => exportAsICSFile({})).toThrow();
    });

    it('should skip entries without date or duration', () => {
      const entries = [
        { id: '1', date: '2025-12-13', duration: 3600000 },
        { id: '2', duration: 3600000 }, // Missing date
        { id: '3', date: '2025-12-13' }  // Missing duration
      ];

      const result = exportAsICSFile(entries);

      expect(result.match(/BEGIN:VEVENT/g).length).toBe(1);
    });
  });

  describe('groupEntriesByDate', () => {
    it('should group entries by date', () => {
      const result = groupEntriesByDate(mockEntries);

      expect(result['2025-12-13'].length).toBe(2);
      expect(result['2025-12-12'].length).toBe(1);
    });

    it('should return empty object for empty array', () => {
      const result = groupEntriesByDate([]);

      expect(result).toEqual({});
    });

    it('should handle null/invalid input', () => {
      expect(groupEntriesByDate(null)).toEqual({});
      expect(groupEntriesByDate('invalid')).toEqual({});
    });

    it('should preserve entry order within date', () => {
      const result = groupEntriesByDate(mockEntries);

      const day13Entries = result['2025-12-13'];
      expect(day13Entries[0].id).toBe('1');
      expect(day13Entries[1].id).toBe('2');
    });
  });

  describe('generateMonthCalendar', () => {
    it('should generate valid month calendar grid', () => {
      const result = generateMonthCalendar(2025, 11, mockEntries); // December 2025

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(Array.isArray(result[0])).toBe(true);
    });

    it('should mark days in/out of month correctly', () => {
      const result = generateMonthCalendar(2025, 11, mockEntries);

      const firstWeek = result[0];
      // December 1 starts on Monday, so first few days should be from previous month
      const daysInMonth = firstWeek.filter(d => d.inMonth).length;
      expect(daysInMonth).toBeGreaterThan(0);
      expect(daysInMonth).toBeLessThanOrEqual(7);
    });

    it('should calculate total hours per day', () => {
      const result = generateMonthCalendar(2025, 11, mockEntries);

      // Find Dec 13
      let found = false;
      result.forEach(week => {
        week.forEach(day => {
          if (day.dateStr === '2025-12-13') {
            expect(day.totalHours).toBe(2.5); // 1h + 1.5h
            found = true;
          }
        });
      });

      expect(found).toBe(true);
    });

    it('should include entries in day objects', () => {
      const result = generateMonthCalendar(2025, 11, mockEntries);

      let found = false;
      result.forEach(week => {
        week.forEach(day => {
          if (day.dateStr === '2025-12-13' && day.entries.length > 0) {
            expect(day.entries[0].category).toBe('work');
            found = true;
          }
        });
      });

      expect(found).toBe(true);
    });
  });

  describe('calculateDateRangeStats', () => {
    it('should calculate stats for date range', () => {
      const result = calculateDateRangeStats(mockEntries, '2025-12-12', '2025-12-13');

      expect(result.totalHours).toBe(4.5); // 1h + 1.5h + 2h
      expect(result.entryCount).toBe(3);
    });

    it('should group stats by category', () => {
      const result = calculateDateRangeStats(mockEntries, '2025-12-12', '2025-12-13');

      expect(result.byCategory['work']).toBeDefined();
      expect(result.byCategory['work'].hours).toBe(3); // 1h + 2h
      expect(result.byCategory['work'].count).toBe(2);
      expect(result.byCategory['school'].hours).toBe(1.5);
    });

    it('should return zero stats for empty/invalid input', () => {
      const result = calculateDateRangeStats([], '2025-12-12', '2025-12-13');

      expect(result.totalHours).toBe(0);
      expect(result.entryCount).toBe(0);
    });

    it('should handle single day query', () => {
      const result = calculateDateRangeStats(mockEntries, '2025-12-13', '2025-12-13');

      expect(result.totalHours).toBe(2.5);
      expect(result.entryCount).toBe(2);
    });

    it('should exclude entries outside date range', () => {
      const result = calculateDateRangeStats(mockEntries, '2025-12-13', '2025-12-13');

      expect(result.entryCount).toBe(2); // Only Dec 13
      expect(result.byCategory['work'].hours).toBe(1); // Dec 13 work entry (1h)
      expect(result.byCategory['school'].hours).toBe(1.5); // Dec 13 school entry
      expect(result.totalHours).toBe(2.5);
    });
  });
});
