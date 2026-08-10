export const DEFAULT_LOCATION = 'Raum 135 (1 OG, rechte Flurseite)';

/**
 * Escapes a value for an iCalendar TEXT property (RFC 5545 §3.3.11).
 * Course descriptions are multi-line German paragraphs full of commas —
 * unescaped they produce structurally invalid VEVENTs.
 */
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Folds a content line to 75 octets, as required by RFC 5545 §3.1.
 * Continuation lines start with a single space.
 */
function foldLine(line) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out = [];
  let current = '';
  let currentBytes = 0;
  // First line holds 75 octets, continuation lines 74 (the leading space counts).
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = out.length === 0 ? 75 : 74;
    if (currentBytes + size > limit) {
      out.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += size;
  }
  if (current) out.push(current);
  return out.join('\r\n ');
}

export function generateICalFile(course) {
  const eventId = `${course.id}@peerskillslab.ch`;

  // Parse date safely — handle dd.MM.yyyy and yyyy-MM-dd formats
  let startDateTime = new Date();
  if (course.date) {
    const dateStr = String(course.date).trim();
    // Extract start time only (before the dash if present)
    let time = String(course.time || '00:00').trim();
    if (time.includes(' - ')) {
      time = time.split(' - ')[0].trim();
    }

    if (dateStr.includes('.')) {
      // Format: dd.MM.yyyy
      const [day, month, year] = dateStr.split('.');
      const pad = (n) => String(n).padStart(2, '0');
      const isoDate = `${year}-${pad(month)}-${pad(day)}`;
      startDateTime = new Date(`${isoDate}T${time}`);
    } else if (dateStr.includes('-')) {
      // Format: yyyy-MM-dd
      startDateTime = new Date(`${dateStr}T${time}`);
    }
  }

  if (isNaN(startDateTime.getTime())) {
    startDateTime = new Date();
  }

  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PeerSkills Lab//NONSGML Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${eventId}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(startDateTime)}`,
    `DURATION:PT${course.duration_minutes || 120}M`,
    `SUMMARY:${escapeText(`Peer Skills Lab ${course.title || ''}`.trim())}`,
    `DESCRIPTION:${escapeText(course.description)}`,
    `LOCATION:${escapeText(course.location || DEFAULT_LOCATION)}`,
    // ORGANIZER erwartet eine CAL-ADDRESS (mailto:), kein Klartextname.
    `ORGANIZER;CN=${escapeText(course.instructor || 'PeerSkills Lab')}:mailto:info@peerskillslab.ch`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.map(foldLine).join('\r\n');
}

export function downloadICalFile(course) {
  const ical = generateICalFile(course);
  const blob = new Blob([ical], { type: 'text/calendar; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(course.title || 'course').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.ics`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
