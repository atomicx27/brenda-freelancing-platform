const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMentorApplications() {
  try {
    const applications = await prisma.mentorApplication.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`\n✅ MentorApplication table exists!`);
    console.log(`📊 Found ${applications.length} applications\n`);

    if (applications.length > 0) {
      applications.forEach((app, idx) => {
        console.log(`${idx + 1}. ${app.user.firstName} ${app.user.lastName}`);
        console.log(`   Status: ${app.status}`);
        console.log(`   Experience: ${app.experience} years`);
        console.log(`   Expertise: ${app.expertise.join(', ')}`);
        console.log(`   Motivation: ${app.motivation.substring(0, 100)}...`);
        console.log('');
      });
    } else {
      console.log('No mentor applications yet. Users can now apply to become mentors!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMentorApplications();
