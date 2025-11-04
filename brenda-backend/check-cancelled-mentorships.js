const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCancelledMentorships() {
  try {
    console.log('\n🔍 Checking for CANCELLED Mentorships...\n');
    console.log('='.repeat(80));

    const cancelled = await prisma.mentorship.findMany({
      where: {
        status: 'CANCELLED'
      },
      include: {
        mentor: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        mentee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`\n📊 Total CANCELLED Mentorships: ${cancelled.length}\n`);

    if (cancelled.length > 0) {
      console.log('⚠️  Found cancelled mentorships that should be deleted:\n');
      
      cancelled.forEach((m, index) => {
        console.log(`${index + 1}. ${m.title}`);
        console.log(`   Status: ${m.status}`);
        console.log(`   Mentor: ${m.mentor.firstName} ${m.mentor.lastName}`);
        console.log(`   Mentee: ${m.mentee.firstName} ${m.mentee.lastName}`);
        console.log(`   Created: ${m.createdAt.toLocaleString()}`);
        console.log('   ' + '-'.repeat(76));
      });

      console.log('\n🗑️  Do you want to delete these? Run:');
      console.log('   node brenda-backend/delete-cancelled-mentorships.js\n');
    } else {
      console.log('✅ No cancelled mentorships found! All rejected requests are being properly deleted.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCancelledMentorships();
