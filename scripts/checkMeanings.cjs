const a = JSON.parse(require('fs').readFileSync('src/data/wordBank.json','utf-8'));
// Check for POS tags embedded in meaning field
const bad = a.filter(e => {
  // Look for patterns like "；v " or "；n " in meaning
  return /；\s*(v|n|a|ad|prep|conj|aux|pron|Ph)\s/.test(e.meaning) ||
         /；\s*(v|n|a|ad|prep|conj|aux|pron|Ph)$/.test(e.meaning);
});
console.log('Entries with POS in meaning:', bad.length);
bad.slice(0, 15).forEach(e => console.log(`  ${e.id}. ${e.word} [${e.pos}] "${e.meaning}"`));
