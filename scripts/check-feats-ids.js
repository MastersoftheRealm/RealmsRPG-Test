const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'codex_csv', 'Realms Codex Test - Feats.csv');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split(/\r?\n/).filter((l) => l.trim());
const rows = lines.slice(1);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) {
      current += c;
      continue;
    }
    if (c === ',') {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += c;
  }
  result.push(current.trim());
  return result;
}

const byId = {};
rows.forEach((line, i) => {
  const cols = parseCSVLine(line);
  const id = cols[0];
  const lineNum = i + 2;
  if (!byId[id]) byId[id] = [];
  byId[id].push({ lineNum, id, name: cols[1] });
});

const dupes = Object.entries(byId).filter(([, arr]) => arr.length > 1);
const empty = Object.entries(byId).filter(([id]) => !id || id === '');

console.log('Total data rows:', rows.length);
console.log('Unique ids:', Object.keys(byId).length);
console.log('Duplicate ids:', dupes.length);
if (dupes.length) {
  dupes.forEach(([id, arr]) => {
    console.log('  id "' + id + '" appears on lines:', arr.map((a) => a.lineNum).join(', '), arr.map((a) => a.name).join(' | '));
  });
}
if (empty.length) {
  console.log('Empty id rows:', empty.length);
  empty.forEach(([id, arr]) => arr.forEach((a) => console.log('  line', a.lineNum, a.name)));
}
