const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteCancelledMentorships() {
  try {
    console.log('\n🗑️  Deleting CANCELLED Mentorships...\n');
    console.log('='.repeat(80));

    // Find all cancelled mentorships first
    const cancelled = await prisma.mentorship.findMany({
      where: {
        status: 'CANCELLED'
      },
      select: {
        id: true,
        title: true
      }
    });

    if (cancelled.length === 0) {
      console.log('\n✅ No cancelled mentorships to delete!\n');
      return;
    }

    console.log(`\nFound ${cancelled.length} cancelled mentorships:\n`);
    cancelled.forEach((m, i) => {
      console.log(`${i + 1}. ${m.title} (ID: ${m.id})`);
    });

    // Delete all cancelled mentorships
    const result = await prisma.mentorship.deleteMany({
      where: {
        status: 'CANCELLED'
      }
    });

    console.log(`\n✅ Successfully deleted ${result.count} cancelled mentorships!\n`);
    console.log('These rejected requests have been permanently removed from the database.');
    console.log('Going forward, all rejected requests will be automatically deleted.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCancelledMentorships();
