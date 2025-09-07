import fs from 'node:fs/promises';

const file = process.argv[2] || 'data/bible.json';
const bible = JSON.parse(await fs.readFile(file, 'utf8'));

console.log('bnumber  |  bname');
console.log('--------------------');
for (const b of bible.books) {
  console.log(String(b.bnumber).padStart(7, ' '), ' | ', b.bname);
}
