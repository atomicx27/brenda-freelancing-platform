const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteMentorships() {
  try {
    const result = await prisma.mentorship.deleteMany({});
    console.log(`✅ Deleted ${result.count} mentorships`);
  } catch (error) {
    console.error('Error deleting mentorships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMentorships();
