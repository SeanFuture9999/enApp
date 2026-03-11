const wb = require('../src/data/wordBank.json');
const st = require('../src/data/sentences.json');

console.log('WordBank total:', wb.length);
console.log('Sentences total:', st.length);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sentenceMap = new Map();
for (const ws of st) sentenceMap.set(ws.wordId, ws);
const available = wb.filter(w => sentenceMap.has(w.id));
console.log('Available words (have sentences):', available.length);

// Check sentence uniqueness
const allSentences = [];
for (const ws of st) {
  for (const s of ws.sentences) {
    allSentences.push({ word: ws.word, en: s.en });
  }
}
console.log('Total sentences:', allSentences.length);

// Check how many unique English sentences
const uniqueEn = new Set(allSentences.map(s => s.en));
console.log('Unique English sentences:', uniqueEn.size);
console.log('Duplicated sentences:', allSentences.length - uniqueEn.size);

// Show some duplicated sentences
const enCount = {};
for (const s of allSentences) {
  enCount[s.en] = (enCount[s.en] || []);
  enCount[s.en].push(s.word);
}
const dupes = Object.entries(enCount).filter(([_, words]) => words.length > 1);
console.log('\nDuplicated sentence examples (same template, different word):');
dupes.slice(0, 5).forEach(([en, words]) => {
  console.log(`  "${en.slice(0, 70)}..." used by: ${words.join(', ')}`);
});

// Simulate 5 rounds - check correct answer distribution
console.log('\n=== Simulating 5 rounds ===');
const positionCounts = [0, 0, 0, 0]; // A, B, C, D
for (let round = 0; round < 5; round++) {
  const selected = shuffle(available).slice(0, 10);
  for (const w of selected) {
    const distractors = shuffle(available.filter(d => d.id !== w.id)).slice(0, 3);
    const options = shuffle([w.word, ...distractors.map(d => d.word)]);
    const correctIdx = options.indexOf(w.word);
    positionCounts[correctIdx]++;
  }
}
console.log('Answer distribution over 50 questions:');
console.log('  A:', positionCounts[0], '| B:', positionCounts[1], '| C:', positionCounts[2], '| D:', positionCounts[3]);

// Show sample quiz
console.log('\n=== Sample Round ===');
const selected = shuffle(available).slice(0, 10);
for (let i = 0; i < selected.length; i++) {
  const w = selected[i];
  const ws = sentenceMap.get(w.id);
  const sentence = ws.sentences[Math.floor(Math.random() * ws.sentences.length)];
  const distractors = shuffle(available.filter(d => d.id !== w.id)).slice(0, 3);
  const options = shuffle([w.word, ...distractors.map(d => d.word)]);
  const correctIdx = options.indexOf(w.word);
  console.log(`\nQ${i + 1}: ${w.word} (${w.pos.join('/')}) - ${w.meaning}`);
  console.log(`  Correct: ${String.fromCharCode(65 + correctIdx)}`);
  console.log(`  Options: ${options.map((o, j) => `(${String.fromCharCode(65 + j)})${o}`).join(' ')}`);
  console.log(`  EN: ${sentence.en}`);
  console.log(`  ZH: ${sentence.zh}`);
  // Check if sentence makes sense with the word
  const sensible = sentence.en.includes('(____)')
  console.log(`  Has blank: ${sensible}`);
}
