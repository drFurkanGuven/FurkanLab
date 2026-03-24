const { PrismaClient } = require("@prisma/client");

// Bridge Netlify Neon extension env var to Prisma's expected DATABASE_URL
if (!process.env.DATABASE_URL && process.env.NETLIFY_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DATABASE_URL;
}

// Add serverless-friendly connection parameters for Neon PostgreSQL
// - connection_limit=1: each serverless function instance uses only 1 connection
// - connect_timeout=15: allow time for Neon cold starts (can take 5-10s)
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connection_limit')) {
  const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?';
  process.env.DATABASE_URL += separator + 'connection_limit=1&connect_timeout=15';
}

// Singleton pattern: reuse PrismaClient across warm serverless invocations
// This prevents connection pool exhaustion from concurrent functions
if (!global.__prisma) {
  global.__prisma = new PrismaClient({
    log: ['error'],
  });
}

const prisma = global.__prisma;

// Helper to convert Prisma errors to user-friendly Turkish messages
function handleDbError(err) {
  const code = err.code || '';
  if (code === 'P1001' || code === 'P1002') {
    return { status: 503, message: 'Veritabanı bağlantısı kurulamadı. Lütfen birkaç saniye bekleyip tekrar deneyin.' };
  }
  if (code === 'P2021') {
    return { status: 500, message: 'Veritabanı tablosu bulunamadı. Lütfen yönetici ile iletişime geçin.' };
  }
  if (code === 'P2025') {
    return { status: 404, message: 'Kayıt bulunamadı.' };
  }
  if (code === 'P2002') {
    return { status: 409, message: 'Bu kayıt zaten mevcut.' };
  }
  if (err.message && err.message.includes('connect')) {
    return { status: 503, message: 'Veritabanı bağlantı hatası. Lütfen birkaç saniye bekleyip tekrar deneyin.' };
  }
  return { status: 500, message: 'Sunucu hatası oluştu.' };
}

module.exports = { prisma, handleDbError };
