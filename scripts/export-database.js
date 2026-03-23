const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'database');

async function exportQuranData() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  console.log('Fetching Quran Turkish translation from CDN...');
  const trRes = await fetch('https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/quran_tr.json');
  if (!trRes.ok) throw new Error('CDN fetch failed: ' + trRes.status);
  const surahs = await trRes.json();

  console.log('Fetching transliteration data from API...');
  const translitRes = await fetch('https://api.alquran.cloud/v1/quran/en.transliteration');

  // Build transliteration lookup
  const translitMap = {};
  if (translitRes.ok) {
    const translitData = await translitRes.json();
    if (translitData.code === 200 && translitData.data && translitData.data.surahs) {
      for (const s of translitData.data.surahs) {
        for (const a of s.ayahs) {
          translitMap[s.number + ':' + a.numberInSurah] = a.text;
        }
      }
    }
    console.log('  Transliteration data loaded:', Object.keys(translitMap).length, 'entries');
  } else {
    console.warn('  Transliteration API failed:', translitRes.status);
  }

  console.log('Processing', surahs.length, 'surahs...');

  const allVerses = [];

  for (const surah of surahs) {
    for (const v of surah.verses) {
      allVerses.push({
        surahNo: surah.id,
        ayahNo: v.id,
        arabicText: v.text,
        turkishMeal: v.translation,
        surahNameAr: surah.name,
        surahNameTr: surah.transliteration,
        transliteration: translitMap[surah.id + ':' + v.id] || null,
      });
    }
  }

  // Save all verses as a single file
  console.log('Saving', allVerses.length, 'verses to quran-verses.json...');
  fs.writeFileSync(
    path.join(DB_DIR, 'quran-verses.json'),
    JSON.stringify(allVerses, null, 2)
  );

  // Also save per-surah files for easier navigation
  const surahDir = path.join(DB_DIR, 'surahs');
  if (!fs.existsSync(surahDir)) {
    fs.mkdirSync(surahDir, { recursive: true });
  }

  for (const surah of surahs) {
    const surahData = {
      id: surah.id,
      name: surah.name,
      transliteration: surah.transliteration,
      type: surah.type,
      total_verses: surah.total_verses,
      verses: surah.verses.map(v => ({
        ayahNo: v.id,
        arabicText: v.text,
        turkishMeal: v.translation,
        transliteration: translitMap[surah.id + ':' + v.id] || null,
      }))
    };
    fs.writeFileSync(
      path.join(surahDir, `surah-${String(surah.id).padStart(3, '0')}.json`),
      JSON.stringify(surahData, null, 2)
    );
  }
  console.log('Saved', surahs.length, 'individual surah files');

  // Create empty placeholder files for tables that couldn't be exported
  const emptyTables = [
    { file: 'users.json', note: 'User accounts - requires direct database access' },
    { file: 'book-events.json', note: 'Book club events - requires direct database access' },
    { file: 'reading-progress.json', note: 'Reading progress records - requires direct database access' },
  ];

  for (const t of emptyTables) {
    fs.writeFileSync(
      path.join(DB_DIR, t.file),
      JSON.stringify({
        _note: t.note,
        _status: 'Database credentials expired - could not export',
        data: []
      }, null, 2)
    );
    console.log('Created placeholder:', t.file);
  }

  // Save export summary
  const summary = {
    exportDate: new Date().toISOString(),
    source: 'CDN + API (direct DB access unavailable)',
    tables: {
      quranVerses: allVerses.length,
      users: 'unavailable - db auth failed',
      bookEvents: 'unavailable - db auth failed',
      readingProgress: 'unavailable - db auth failed',
    },
    files: {
      'quran-verses.json': allVerses.length + ' verses (all surahs combined)',
      'surahs/': surahs.length + ' individual surah JSON files',
      'users.json': 'placeholder (db unavailable)',
      'book-events.json': 'placeholder (db unavailable)',
      'reading-progress.json': 'placeholder (db unavailable)',
    },
    dbConnectionError: 'password authentication failed for user neondb_owner',
  };

  fs.writeFileSync(
    path.join(DB_DIR, 'export-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log('\n=== Export Summary ===');
  console.log('Quran verses exported:', allVerses.length);
  console.log('Surah files created:', surahs.length);
  console.log('DB tables (users, events, progress): UNAVAILABLE (auth failed)');
  console.log('All files saved to:', DB_DIR);
}

exportQuranData()
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
