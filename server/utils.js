const { randomUUID } = require('crypto');

function newId() {
  return randomUUID();
}

// Parse sort param like "-created_date" → { col: "created_date", dir: "DESC" }
// `prefix` qualifiziert die Spalte für Queries mit JOIN (z.B. "b" → "b.created_date").
function parseSort(sortParam, allowedCols, prefix) {
  if (!sortParam) return null;
  const desc = sortParam.startsWith('-');
  const col = desc ? sortParam.slice(1) : sortParam;
  if (!allowedCols.includes(col)) return null;
  return { col: prefix ? `${prefix}.${col}` : col, dir: desc ? 'DESC' : 'ASC' };
}

// Build WHERE clause from query params, skipping reserved params
const RESERVED = new Set(['sort', 'limit', 'offset']);

function buildWhere(query, allowedCols, prefix) {
  const conditions = [];
  const values = [];
  let paramCount = 0;
  for (const [key, val] of Object.entries(query)) {
    if (RESERVED.has(key)) continue;
    if (!allowedCols.includes(key)) continue;
    if (val === undefined || val === '') continue;
    // Wiederholte Query-Parameter parst Express zu einem Array; das erzeugt in pg
    // einen Typfehler (500) statt eines sinnvollen Ergebnisses.
    if (typeof val !== 'string') continue;
    paramCount++;
    conditions.push(`${prefix ? `${prefix}.` : ''}${key} = $${paramCount}`);
    values.push(val);
  }
  return { conditions, values };
}

// Build a parameterised UPDATE from a whitelist.
// → { setClause: "a = $1, b = $2", values: [...], nextParam: 3 }
function buildUpdate(body, editable) {
  const values = [];
  const parts = [];
  for (const key of editable) {
    if (body[key] === undefined) continue;
    values.push(body[key]);
    parts.push(`${key} = $${values.length}`);
  }
  return { setClause: parts.join(', '), values, nextParam: values.length + 1 };
}

const COURSE_TIME_ZONE = 'Europe/Zurich';

// Versatz von `tz` zu UTC in Millisekunden zum Zeitpunkt `utcMs` (inkl. Sommerzeit).
function tzOffsetMs(utcMs, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(utcMs)).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

// Kursbeginn als Date. Kurse haben `date` ("YYYY-MM-DD") und `time` ("10:00 - 12:00"
// oder "10:00") als Schweizer Ortszeit. Der Server läuft in UTC, deshalb wird die
// Zeit ausdrücklich als Europe/Zurich gelesen. Ohne lesbare Uhrzeit gilt Mitternacht,
// ohne lesbares Datum null. Gleiche Regel wie getCourseStartDateTime im Frontend.
function courseStart(dateStr, timeStr) {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ''));
  if (!d) return null;
  const t = /^(\d{1,2}):(\d{2})/.exec(String(timeStr || '').split(' - ')[0].trim());
  const guess = Date.UTC(+d[1], +d[2] - 1, +d[3], t ? +t[1] : 0, t ? +t[2] : 0);
  // Zweimal angleichen, damit auch der Moment der Zeitumstellung stimmt.
  let ms = guess - tzOffsetMs(guess, COURSE_TIME_ZONE);
  ms = guess - tzOffsetMs(ms, COURSE_TIME_ZONE);
  return new Date(ms);
}

// Nutzerdaten ohne Passwort-Hash für API-Antworten
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = { newId, parseSort, buildWhere, buildUpdate, courseStart, sanitizeUser };
