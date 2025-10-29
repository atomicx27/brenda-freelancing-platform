import { PrismaClient } from '@prisma/client';

// Create a single Prisma client instance with optimized connection pool settings
const prisma = new PrismaClient({
  // Optimize connection pool for development
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
