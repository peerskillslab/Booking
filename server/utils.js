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

module.exports = { newId, parseSort, buildWhere, buildUpdate };
