import fs from 'fs';
import path from 'path';

const I18N_DIR = path.join(process.cwd(), 'public/i18n');

const processFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  let words = JSON.parse(content);

  // 1. Reset isFree
  words = words.map(w => ({ ...w, isFree: false }));

  let freeCount = 0;
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  // 2. Step 1 (Easy Base): Select up to 36 words with difficulty: 1
  for (const word of words) {
    if (word.metadata.difficulty === 1 && easyCount < 36) {
      word.isFree = true;
      easyCount++;
      freeCount++;
    }
  }

  // 3. Step 2 (Medium Pack): Select up to 18 words with difficulty: 2
  for (const word of words) {
    if (word.metadata.difficulty === 2 && mediumCount < 18) {
      word.isFree = true;
      mediumCount++;
      freeCount++;
    }
  }

  // 4. Step 3 (Hard Teaser): Select up to 6 words with difficulty: 3 (teaser, always truthful)
  for (const word of words) {
    if (word.metadata.difficulty === 3 && hardCount < 6) {
      word.isFree = true;
      hardCount++;
      freeCount++;
    }
  }

  // 5. Validation / Backfill (Waterfall)
  const TARGET_TOTAL = 60;

  if (freeCount < TARGET_TOTAL) {
    console.log(`[Backfill] ${path.basename(filePath)} needs backfill. Current: ${freeCount}`);

    // Backfill with Medium words first
    for (const word of words) {
      if (freeCount >= TARGET_TOTAL) break;
      if (!word.isFree && word.metadata.difficulty === 2) {
        word.isFree = true;
        mediumCount++;
        freeCount++;
      }
    }

    // Backfill with Hard words second
    for (const word of words) {
      if (freeCount >= TARGET_TOTAL) break;
      if (!word.isFree && word.metadata.difficulty === 3) {
        word.isFree = true;
        hardCount++;
        freeCount++;
      }
    }

    // Backfill with Easy words last
    for (const word of words) {
      if (freeCount >= TARGET_TOTAL) break;
      if (!word.isFree && word.metadata.difficulty === 1) {
        word.isFree = true;
        easyCount++;
        freeCount++;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(words, null, 2));
  console.log(`Updated ${path.basename(filePath)}: Free words = ${freeCount} (Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount})`);
};

const main = () => {
  if (!fs.existsSync(I18N_DIR)) {
      console.error(`Directory not found: ${I18N_DIR}`);
      process.exit(1);
  }
  const files = fs.readdirSync(I18N_DIR).filter(f => f.endsWith('_en.json'));

  files.forEach(file => {
    processFile(path.join(I18N_DIR, file));
  });
};

main();
