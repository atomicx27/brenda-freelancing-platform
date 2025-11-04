const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMentorships() {
  try {
    const mentorships = await prisma.mentorship.findMany({
      take: 10,
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
    
    console.log('Total mentorships:', mentorships.length);
    console.log(JSON.stringify(mentorships, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMentorships();
