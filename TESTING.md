# TimeTracker – Development Guide & Testing Setup

## 🎯 Überblick

Dieses Dokument beschreibt die **Entwicklungs-Umgebung**, **Test-Setup**, und **neue Features** für das TimeTracker-Projekt.

---

## 📦 Installation & Setup

### 1. Dependencies installieren

```bash
npm install
```

Dies installiert alle erforderlichen Dev-Dependencies:
- **Jest** – Test-Framework
- **Babel** – JavaScript-Transpiler
- **ESLint** – Code-Linter
- **jsdom** – DOM-Emulation für Tests

### 2. Test-Verzeichnis Struktur

```
tests/
├── setup.js                  # Jest-Setup (LocalStorage, Mocks)
├── timerHelpers.js          # Timer-Logik (Kerne Funktionen)
├── timer.test.js            # Timer-Tests
├── backupHelpers.js         # Backup/Export-Logik
├── backup.test.js           # Backup-Tests
├── calendarHelpers.js       # iCal/Kalender-Logik
├── calendar.test.js         # Kalender-Tests
├── multiProfileHelpers.js   # Multi-Profile-Logik
└── multiProfile.test.js     # Multi-Profile-Tests
```

---

## 🧪 Tests ausführen

### Alle Tests starten
```bash
npm test
```

### Tests im Watch-Mode (Auto-Reload)
```bash
npm run test:watch
```

### Coverage-Report generieren
```bash
npm run test:coverage
```

Coverage-Report wird unter `coverage/` generiert.

---

## 🔧 Neuen Test schreiben

### Beispiel: Timer-Test

```javascript
import { formatTime } from '../tests/timerHelpers';

describe('formatTime', () => {
  it('should format milliseconds correctly', () => {
    expect(formatTime(3661000)).toBe('01:01:01');
  });
});
```

### Test ausführen
```bash
npm test -- timer.test.js
```

---

## 📊 Neue Features & Helper-Module

### 1️⃣ Timer-Funktionen (`timerHelpers.js`)

```javascript
import {
  formatTime,
  timeStringToMs,
  msToHours,
  getElapsedTime,
  validateTimer
} from './tests/timerHelpers';

// Beispiele
formatTime(3600000);        // => "01:00:00"
timeStringToMs('01:30:00'); // => 5400000
msToHours(7200000);         // => 2
```

**Getestete Funktionen:**
- ✅ Zeitformatierung (HH:MM:SS)
- ✅ Millisekunden-Konvertierung
- ✅ Timer-Validierung

---

### 2️⃣ Backup & Export (`backupHelpers.js`)

```javascript
import {
  exportAsJSON,
  exportAsCSV,
  importFromJSON,
  saveToStorage,
  loadFromStorage
} from './tests/backupHelpers';

// Beispiele
const json = exportAsJSON(entries);  // JSON-Export
const csv = exportAsCSV(entries);    // CSV-Export
importFromJSON(jsonString);          // JSON-Import mit Validierung
```

**Unterstützte Formate:**
- ✅ JSON (mit Versioning)
- ✅ CSV (mit Escape-Handling)
- ✅ LocalStorage (mit Fehler-Handling)

---

### 3️⃣ Kalender & iCal Export (`calendarHelpers.js`)

```javascript
import {
  exportAsICSFile,
  groupEntriesByDate,
  generateMonthCalendar,
  calculateDateRangeStats
} from './tests/calendarHelpers';

// Beispiele
const ics = exportAsICSFile(entries, 'MaxMustermann');
const grouped = groupEntriesByDate(entries);
const calendar = generateMonthCalendar(2025, 11, entries);
const stats = calculateDateRangeStats(entries, '2025-12-01', '2025-12-31');
```

**Features:**
- ✅ RFC 5545 compliant iCal Format
- ✅ Monatliche Kalender-Grid-Generierung
- ✅ Datums-Range Statistiken

---

### 4️⃣ Multi-Profile Mode (`multiProfileHelpers.js`)

```javascript
import {
  createProfile,
  saveProfiles,
  loadProfiles,
  upsertProfile,
  deleteProfile,
  getActiveProfile,
  setActiveProfileId,
  addEntryToProfile,
  removeEntryFromProfile,
  exportAllProfiles,
  importProfiles,
  listProfiles,
  searchProfiles
} from './tests/multiProfileHelpers';

// Beispiele
const profile = createProfile('John Doe', {
  workHoursPerDay: 6,
  color: '#ff0000',
  team: 'Team A'
});

upsertProfile(profile);
setActiveProfileId(profile.id);
addEntryToProfile(profile.id, timerEntry);
```

**Features:**
- ✅ Mehrere lokale Profile
- ✅ Profil-spezifische Einträge
- ✅ Backup/Restore aller Profile
- ✅ Profil-Suche

---

## 🚀 GitHub Actions CI/CD

### Workflow-Datei
`.github/workflows/ci-cd.yml` wird bei jedem **Push** oder **Pull Request** ausgeführt.

### Schritte:
1. **Lint** – ESLint prüft Code-Stil
2. **Test** – Jest führt alle Tests aus
3. **Coverage** – Coverage wird zu Codecov hochgeladen
4. **Build** – App-Build verifiziert
5. **Lighthouse CI** – Performance/Accessibility-Checks
6. **Security** – npm audit + OWASP Dependency Check

### Status anschauen
GitHub → Repository → Actions

---

## 🔍 ESLint konfigurieren

`.eslintrc.json` definiert Code-Stil:

```bash
npm run lint
```

Regeln:
- 2 Spaces Indentation
- Single Quotes (`'` statt `"`)
- Keine `var` (nur `const`/`let`)
- `eqeqeq` für strikte Gleichheit

---

## 📋 Checkliste für neue Features

- [ ] Feature-Funktion schreiben in `tests/featureHelpers.js`
- [ ] Unit-Tests schreiben in `tests/feature.test.js`
- [ ] Alle Tests müssen grün ✅ sein
- [ ] ESLint Warnings beheben
- [ ] Coverage-Schwellwert erfüllt (60%+)
- [ ] GitHub Actions Workflow durchlaufen
- [ ] README aktualisieren

---

## 🛠 Häufige Befehle

```bash
# Tests
npm test                  # Alle Tests einmal
npm run test:watch      # Tests im Watch-Mode
npm run test:coverage   # Mit Coverage-Report

# Lint
npm run lint            # ESLint
npm run lint --fix      # Auto-Fix (wenn möglich)

# Development
npm run dev             # Tests im Watch-Mode

# Build
npm run build           # Verifikation (Single-File, kein echtes Build)
```

---

## 📚 Weitere Ressourcen

- [Jest Dokumentation](https://jestjs.io/)
- [RFC 5545 – iCalendar](https://tools.ietf.org/html/rfc5545)
- [GitHub Actions](https://docs.github.com/en/actions)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

## 🤝 Contributing

1. Branch erstellen: `git checkout -b feature/my-feature`
2. Tests schreiben & verifizieren
3. ESLint Checks beheben
4. PR erstellen mit Beschreibung

Siehe auch: [`Rechtliches/CONTRIBUTING.md`](Rechtliches/CONTRIBUTING.md)

---

## 📞 Fragen?

Öffne ein GitHub Issue oder diskutiere im Pull Request.

---

**Viel Erfolg beim Entwickeln! 🚀**
