const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function importDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable gerekli.");
    console.error("Kullanım: DATABASE_URL='postgresql://...' node scripts/import-db.js");
    process.exit(1);
  }

  const inputPath = process.argv[2] || path.join(__dirname, "..", "database-export.json");

  if (!fs.existsSync(inputPath)) {
    console.error(`ERROR: Export dosyası bulunamadı: ${inputPath}`);
    console.error("Kullanım: DATABASE_URL='...' node scripts/import-db.js [dosya-yolu]");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    console.log(`Dosya okunuyor: ${inputPath}`);
    const exportData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    console.log(`Export tarihi: ${exportData.exportedAt}`);

    console.log("\nVeritabanına bağlanılıyor...");

    // 1. Kuran ayetleri
    const verses = exportData.tables.quranVerses.data;
    if (verses.length > 0) {
      console.log(`Kuran ayetleri import ediliyor (${verses.length} ayet)...`);
      for (let i = 0; i < verses.length; i += 500) {
        const batch = verses.slice(i, i + 500);
        await prisma.quranVerse.createMany({
          data: batch.map(({ id, ...rest }) => rest),
          skipDuplicates: true,
        });
        console.log(`  ${Math.min(i + 500, verses.length)}/${verses.length} ayet tamamlandı`);
      }
    }

    // 2. Kullanıcılar
    const users = exportData.tables.users.data;
    if (users.length > 0) {
      console.log(`Kullanıcılar import ediliyor (${users.length})...`);
      await prisma.user.createMany({
        data: users,
        skipDuplicates: true,
      });
    }

    // 3. Kitap etkinlikleri
    const events = exportData.tables.bookEvents.data;
    if (events.length > 0) {
      console.log(`Kitap etkinlikleri import ediliyor (${events.length})...`);
      await prisma.bookEvent.createMany({
        data: events,
        skipDuplicates: true,
      });
    }

    // 4. Okuma ilerlemeleri
    const progress = exportData.tables.readingProgress.data;
    if (progress.length > 0) {
      console.log(`Okuma ilerlemeleri import ediliyor (${progress.length})...`);
      await prisma.readingProgress.createMany({
        data: progress,
        skipDuplicates: true,
      });
    }

    console.log("\nImport başarıyla tamamlandı!");
    console.log(`Toplam import edilen kayıt: ${verses.length + users.length + events.length + progress.length}`);
  } catch (error) {
    console.error("Import hatası:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importDatabase();
