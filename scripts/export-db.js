const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function exportDatabase() {
  if (!process.env.DATABASE_URL && !process.env.NETLIFY_DATABASE_URL) {
    console.error("ERROR: DATABASE_URL veya NETLIFY_DATABASE_URL environment variable gerekli.");
    console.error("Kullanım: DATABASE_URL='postgresql://...' node scripts/export-db.js");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL && process.env.NETLIFY_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
  }

  const prisma = new PrismaClient();

  try {
    console.log("Veritabanına bağlanılıyor...");

    const [users, bookEvents, readingProgress, quranVerses] = await Promise.all([
      prisma.user.findMany(),
      prisma.bookEvent.findMany(),
      prisma.readingProgress.findMany(),
      prisma.quranVerse.findMany(),
    ]);

    console.log(`Kullanıcılar: ${users.length}`);
    console.log(`Kitap Etkinlikleri: ${bookEvents.length}`);
    console.log(`Okuma İlerlemeleri: ${readingProgress.length}`);
    console.log(`Kuran Ayetleri: ${quranVerses.length}`);

    const exportData = {
      exportedAt: new Date().toISOString(),
      tables: {
        users: { count: users.length, data: users },
        bookEvents: { count: bookEvents.length, data: bookEvents },
        readingProgress: { count: readingProgress.length, data: readingProgress },
        quranVerses: { count: quranVerses.length, data: quranVerses },
      },
      schema: {
        provider: "postgresql",
        prismaVersion: "6.5.0",
        models: ["User", "BookEvent", "ReadingProgress", "QuranVerse"],
      },
    };

    const outputPath = path.join(__dirname, "..", "database-export.json");
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\nExport başarılı! Dosya: ${outputPath}`);
    console.log(`Toplam kayıt: ${users.length + bookEvents.length + readingProgress.length + quranVerses.length}`);
  } catch (error) {
    console.error("Export hatası:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportDatabase();
