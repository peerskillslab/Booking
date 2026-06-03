export function generateICalFile(course) {
  const eventId = `${course.id}@peerskillslab.ch`;

  // Parse date safely — handle dd.MM.yyyy format
  let startDateTime = new Date();
  if (course.date) {
    const dateStr = course.date;
    if (dateStr.includes('.')) {
      // Format: dd.MM.yyyy
      const [day, month, year] = dateStr.split('.');
      const pad = (n) => String(n).padStart(2, '0');
      // Create date in local timezone, not UTC
      const isoDate = `${year}-${pad(month)}-${pad(day)}`;
      const time = course.time || '00:00';
      startDateTime = new Date(`${isoDate}T${time}:00`);
    } else if (dateStr.includes('-')) {
      // Format: yyyy-MM-dd
      const time = course.time || '00:00';
      startDateTime = new Date(`${dateStr}T${time}:00`);
    }
  }

  if (isNaN(startDateTime.getTime())) {
    console.warn('Invalid date for course:', course);
    startDateTime = new Date();
  }

  const startStr = startDateTime.toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z';

  const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PeerSkills Lab//NONSGML Event//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, -5)}Z
DTSTART:${startStr}
DURATION:PT${course.duration_minutes || 120}M
SUMMARY:${course.title}
DESCRIPTION:${course.description || ''}
LOCATION:${course.location || 'Raum 135 (1 OG, rechte Flurseite)'}
ORGANIZER:${course.instructor || 'PeerSkills Lab'}
END:VEVENT
END:VCALENDAR`;

  return icalContent;
}

export function downloadICalFile(course) {
  try {
    const ical = generateICalFile(course);
    const blob = new Blob([ical], { type: 'text/calendar; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(course.title || 'course').replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.ics`;
    link.style.display = 'none';
    document.body.appendChild(link);
    setTimeout(() => {
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    }, 0);
  } catch (error) {
    console.error('Error downloading iCal file:', error);
  }
}
