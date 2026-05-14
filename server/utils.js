const { randomUUID } = require('crypto');

function newId() {
  return randomUUID();
}

// Parse sort param like "-created_date" → { col: "created_date", dir: "DESC" }
function parseSort(sortParam, allowedCols) {
  if (!sortParam) return null;
  const desc = sortParam.startsWith('-');
  const col = desc ? sortParam.slice(1) : sortParam;
  if (!allowedCols.includes(col)) return null;
  return { col, dir: desc ? 'DESC' : 'ASC' };
}

// Build WHERE clause from query params, skipping reserved params
const RESERVED = new Set(['sort', 'limit', 'offset']);

function buildWhere(query, allowedCols) {
  const conditions = [];
  const values = [];
  for (const [key, val] of Object.entries(query)) {
    if (RESERVED.has(key)) continue;
    if (!allowedCols.includes(key)) continue;
    if (val === undefined || val === '') continue;
    conditions.push(`${key} = ?`);
    values.push(val);
  }
  return { conditions, values };
}

module.exports = { newId, parseSort, buildWhere };
