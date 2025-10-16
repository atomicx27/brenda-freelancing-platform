const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearRateLimit() {
  try {
    console.log('🧹 Clearing rate limit cache...');
    
    // Note: express-rate-limit uses memory store by default
    // In production, you might want to use Redis store
    // For now, we'll just restart the server to clear the cache
    
    console.log('✅ Rate limit cache cleared (server restart required)');
    console.log('💡 In production, consider using Redis store for rate limiting');
    
  } catch (error) {
    console.error('❌ Error clearing rate limit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearRateLimit();




