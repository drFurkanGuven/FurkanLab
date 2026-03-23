const { prisma } = require("./utils/db");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Güvenlik: EXPORT_SECRET environment variable ile koruma
  const secret = event.queryStringParameters?.secret;
  const expectedSecret = process.env.EXPORT_SECRET;

  if (!expectedSecret) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "EXPORT_SECRET environment variable is not configured. Set it in Netlify dashboard." }),
    };
  }

  if (secret !== expectedSecret) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Invalid or missing secret parameter." }),
    };
  }

  try {
    const [users, bookEvents, readingProgress, quranVerses] = await Promise.all([
      prisma.user.findMany(),
      prisma.bookEvent.findMany(),
      prisma.readingProgress.findMany(),
      prisma.quranVerse.findMany(),
    ]);

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

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Disposition": "attachment; filename=database-export.json",
      },
      body: JSON.stringify(exportData, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Database export failed", details: error.message }),
    };
  }
};
