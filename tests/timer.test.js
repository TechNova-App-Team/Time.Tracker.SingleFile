/**
 * Timer Core Tests
 * Unit Tests für Timer-Funktionen
 */

import {
  getElapsedTime,
  formatTime,
  timeStringToMs,
  msToHours,
  validateTimer
} from '../tests/timerHelpers';

describe('Timer Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatTime', () => {
    it('should format milliseconds to HH:MM:SS', () => {
      expect(formatTime(3661000)).toBe('01:01:01'); // 1h 1m 1s
      expect(formatTime(0)).toBe('00:00:00');
      expect(formatTime(3600000)).toBe('01:00:00'); // 1h
    });

    it('should handle edge cases', () => {
      expect(formatTime(null)).toBe('00:00:00');
      expect(formatTime(undefined)).toBe('00:00:00');
      expect(formatTime(-1000)).toBe('00:00:00');
    });

    it('should pad with leading zeros', () => {
      expect(formatTime(1000)).toBe('00:00:01');
      expect(formatTime(60000)).toBe('00:01:00');
    });
  });

  describe('timeStringToMs', () => {
    it('should convert HH:MM:SS to milliseconds', () => {
      expect(timeStringToMs('01:01:01')).toBe(3661000);
      expect(timeStringToMs('00:00:00')).toBe(0);
      expect(timeStringToMs('01:00:00')).toBe(3600000);
    });

    it('should handle invalid inputs', () => {
      expect(timeStringToMs(null)).toBe(0);
      expect(timeStringToMs('')).toBe(0);
      expect(timeStringToMs('invalid')).toBe(0);
      expect(timeStringToMs('25:99:99')).toBe(0); // Invalid time
    });
  });

  describe('msToHours', () => {
    it('should convert milliseconds to hours', () => {
      expect(msToHours(3600000)).toBe(1); // 1 hour
      expect(msToHours(7200000)).toBe(2); // 2 hours
      expect(msToHours(1800000)).toBe(0.5); // 30 minutes
    });

    it('should handle edge cases', () => {
      expect(msToHours(0)).toBe(0);
      expect(msToHours(null)).toBe(0);
      expect(msToHours(-1000)).toBe(0);
    });

    it('should be precise', () => {
      const result = msToHours(5400000); // 1.5 hours
      expect(Math.abs(result - 1.5) < 0.0001).toBe(true);
    });
  });

  describe('validateTimer', () => {
    it('should validate correct timer data', () => {
      const result = validateTimer({
        startTime: Date.now(),
        pausedTime: 0,
        category: 'work'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid data', () => {
      const result = validateTimer({
        startTime: 'invalid',
        pausedTime: -100
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require timer data', () => {
      const result = validateTimer(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Timer data is required');
    });
  });

  describe('getElapsedTime', () => {
    it('should calculate elapsed time', () => {
      const startTime = Date.now() - 5000; // 5 seconds ago
      const elapsed = getElapsedTime(startTime, 0);
      expect(elapsed).toBeGreaterThanOrEqual(4900); // Allow 100ms margin
      expect(elapsed).toBeLessThanOrEqual(5100);
    });

    it('should subtract paused time', () => {
      const startTime = Date.now() - 10000; // 10 seconds ago
      const pausedTime = 3000; // 3 seconds paused
      const elapsed = getElapsedTime(startTime, pausedTime);
      expect(elapsed).toBeGreaterThanOrEqual(6900); // ~7 seconds (10 - 3)
      expect(elapsed).toBeLessThanOrEqual(7100);
    });

    it('should return 0 for no start time', () => {
      expect(getElapsedTime(null, 0)).toBe(0);
      expect(getElapsedTime(undefined, 0)).toBe(0);
    });
  });
});
