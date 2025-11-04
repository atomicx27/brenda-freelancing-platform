const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllMentorships() {
  try {
    console.log('\n🔍 Checking All Mentorships in Database...\n');
    console.log('='.repeat(80));

    const mentorships = await prisma.mentorship.findMany({
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Total Mentorships: ${mentorships.length}\n`);

    if (mentorships.length === 0) {
      console.log('❌ No mentorships found in the database.');
      console.log('\nThis could mean:');
      console.log('1. No mentorship requests have been created yet');
      console.log('2. The database was cleared');
      console.log('\n✅ To test: Create a mentorship request from the frontend');
    } else {
      const pending = mentorships.filter(m => m.status === 'PENDING');
      const active = mentorships.filter(m => m.status === 'ACTIVE');
      const completed = mentorships.filter(m => m.status === 'COMPLETED');
      const cancelled = mentorships.filter(m => m.status === 'CANCELLED');

      console.log('📈 Status Breakdown:');
      console.log(`   PENDING: ${pending.length}`);
      console.log(`   ACTIVE: ${active.length}`);
      console.log(`   COMPLETED: ${completed.length}`);
      console.log(`   CANCELLED: ${cancelled.length}`);
      console.log('\n' + '='.repeat(80) + '\n');

      mentorships.forEach((m, index) => {
        console.log(`${index + 1}. ${m.title}`);
        console.log(`   Status: ${m.status}`);
        console.log(`   Mentor: ${m.mentor.firstName} ${m.mentor.lastName} (${m.mentor.email})`);
        console.log(`   Mentee: ${m.mentee.firstName} ${m.mentee.lastName} (${m.mentee.email})`);
        console.log(`   Category: ${m.category || 'N/A'}`);
        console.log(`   Skills: ${m.skills?.join(', ') || 'N/A'}`);
        console.log(`   Message: ${m.description?.substring(0, 100)}${m.description?.length > 100 ? '...' : ''}`);
        console.log(`   Created: ${m.createdAt.toLocaleString()}`);
        console.log('   ' + '-'.repeat(76));
      });

      console.log('\n✅ Backend Query Test:');
      console.log('The API endpoint should return mentorships where:');
      console.log('- User is either mentor OR mentee');
      console.log('- All statuses included (PENDING, ACTIVE, etc.)');
      console.log('- Requires authentication');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllMentorships();
