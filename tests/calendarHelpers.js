/**
 * iCal Export & Calendar Functions
 * RFC 5545 compliant iCalendar format export
 */

/**
 * Konvertiert ein Timer-Entry zu iCal Event-Format
 * @param {Object} entry - Timer-Eintrag {id, date, duration, category, notes}
 * @returns {string} iCal VEVENT string
 */
function entryToICalEvent(entry) {
  const eventDate = new Date(entry.date);
  const dtstart = formatICalDate(eventDate);
  const durationMinutes = Math.floor((entry.duration || 0) / 60000);
  const dtend = new Date(eventDate.getTime() + (durationMinutes * 60000));
  const dtendStr = formatICalDate(dtend);

  const summary = `Work: ${entry.category || 'General'} - ${formatDuration(entry.duration || 0)}`;
  const description = entry.notes ? entry.notes.replace(/\n/g, '\\n') : '';
  const uid = `${entry.id}@timetracker.local`;
  const created = new Date().toISOString();

  return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICalDate(new Date(created))}
DTSTART:${dtstart}
DTEND:${dtendStr}
SUMMARY:${summary}
DESCRIPTION:${description}
CATEGORIES:${entry.category || 'Work'}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT`;
}

/**
 * Formatiert Datum für iCal (YYYYMMDDTHHMMSSZ)
 * @param {Date} date - JavaScript Date
 * @returns {string} iCal-formatiertes Datum
 */
function formatICalDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Formatiert Millisekunden zu HH:MM Format
 * @param {number} ms - Millisekunden
 * @returns {string} HH:MM formatierte Zeit
 */
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Exportiert Timer-Einträge als iCal (ICS) Dateiformat
 * @param {Array} entries - Liste der Timer-Einträge
 * @param {string} username - Optional: Benutzer-Name für Kalender-Titel
 * @returns {string} iCal-formatierter String
 */
export function exportAsICSFile(entries, username = 'TimeTracker') {
  if (!Array.isArray(entries)) {
    throw new Error('Entries must be an array');
  }

  const now = new Date();
  const prodId = '-//TimeTracker//TimeTracker V2.1.1//DE';
  const events = entries
    .filter(e => e.date && e.duration)
    .map(entryToICalEvent)
    .join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${username}'s Time Tracker
X-WR-TIMEZONE:Europe/Berlin
X-WR-CALDESC:Work entries from TimeTracker App
DTSTAMP:${formatICalDate(now)}
${events}
END:VCALENDAR`;
}

/**
 * Konvertiert Einträge zu Kalender-Ansicht (Tag -> Einträge Mapping)
 * @param {Array} entries - Timer-Einträge
 * @returns {Object} {date: [entries]}
 */
export function groupEntriesByDate(entries) {
  if (!Array.isArray(entries)) {
    return {};
  }

  return entries.reduce((acc, entry) => {
    const dateKey = entry.date || new Date().toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {});
}

/**
 * Generiert Kalender-Grid für einen Monat
 * @param {number} year - Jahr
 * @param {number} month - Monat (0-11)
 * @param {Array} entries - Timer-Einträge
 * @returns {Array} Array mit Wochen-Arrays
 */
export function generateMonthCalendar(year, month, entries = []) {
  const grouped = groupEntriesByDate(entries);
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start on Sunday

  const weeks = [];
  let currentWeek = [];

  for (let d = new Date(startDate); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayEntries = grouped[dateStr] || [];
    const totalHours = dayEntries.reduce((sum, e) => sum + ((e.duration || 0) / 3600000), 0);

    currentWeek.push({
      date: new Date(d),
      dateStr,
      entries: dayEntries,
      totalHours: parseFloat(totalHours.toFixed(2)),
      inMonth: d.getMonth() === month
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

/**
 * Berechnet Statistiken für einen Datumsbereich
 * @param {Array} entries - Timer-Einträge
 * @param {string} startDate - Startdatum (YYYY-MM-DD)
 * @param {string} endDate - Enddatum (YYYY-MM-DD)
 * @returns {Object} Statistiken {totalHours, byCategory, entryCount}
 */
export function calculateDateRangeStats(entries, startDate, endDate) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { totalHours: 0, byCategory: {}, entryCount: 0 };
  }

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000); // Include entire end day

  const filtered = entries.filter(e => {
    const eTime = new Date(e.date).getTime();
    return eTime >= start && eTime < end;
  });

  let totalMs = 0;
  const byCategory = {};

  filtered.forEach(e => {
    const duration = e.duration || 0;
    totalMs += duration;

    const category = e.category || 'unknown';
    if (!byCategory[category]) {
      byCategory[category] = { duration: 0, count: 0 };
    }
    byCategory[category].duration += duration;
    byCategory[category].count += 1;
  });

  return {
    totalHours: parseFloat((totalMs / 3600000).toFixed(2)),
    byCategory: Object.keys(byCategory).reduce((acc, cat) => {
      acc[cat] = {
        hours: parseFloat((byCategory[cat].duration / 3600000).toFixed(2)),
        count: byCategory[cat].count
      };
      return acc;
    }, {}),
    entryCount: filtered.length
  };
}

export { formatICalDate, formatDuration };
