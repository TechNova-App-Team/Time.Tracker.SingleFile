/**
 * Timer Core Functions (extracted from index.html)
 * Zentrale Timer-Logik für Tests
 */

/**
 * Berechnet die verstrichene Zeit in Millisekunden
 * @param {number} startTime - Start-Timestamp (ms)
 * @param {number} pausedTime - Insgesamt pausierte Zeit (ms)
 * @returns {number} Verstrichene Zeit in ms
 */
export function getElapsedTime(startTime, pausedTime = 0) {
  if (!startTime) return 0;
  return Date.now() - startTime - pausedTime;
}

/**
 * Formatiert Millisekunden in HH:MM:SS
 * @param {number} ms - Zeit in Millisekunden
 * @returns {string} Formatierte Zeit "HH:MM:SS"
 */
export function formatTime(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Konvertiert HH:MM:SS zu Millisekunden
 * @param {string} timeStr - Zeit im Format "HH:MM:SS"
 * @returns {number} Zeit in Millisekunden
 */
export function timeStringToMs(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [hours, minutes, seconds] = parts;
  // Validiere Grenzen
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return 0;
  }
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

/**
 * Konvertiert Millisekunden zu Stunden (Dezimal)
 * @param {number} ms - Zeit in Millisekunden
 * @returns {number} Zeit in Stunden
 */
export function msToHours(ms) {
  if (!ms || ms < 0) return 0;
  return ms / (1000 * 60 * 60);
}

/**
 * Validiert Timer-Eingaben
 * @param {Object} timerData - {startTime, pausedTime, category}
 * @returns {Object} {isValid, errors}
 */
export function validateTimer(timerData) {
  const errors = [];
  
  if (!timerData) {
    errors.push('Timer data is required');
    return { isValid: false, errors };
  }
  
  if (timerData.startTime && typeof timerData.startTime !== 'number') {
    errors.push('startTime must be a number (timestamp)');
  }
  
  if (timerData.pausedTime && typeof timerData.pausedTime !== 'number') {
    errors.push('pausedTime must be a number');
  }
  
  if (timerData.pausedTime && timerData.pausedTime < 0) {
    errors.push('pausedTime cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
