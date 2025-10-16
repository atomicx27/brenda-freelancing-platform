const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyJobs() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Found ${jobs.length} jobs in the database:\n`);
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title}`);
      console.log(`   💰 Budget: $${job.budget} (${job.budgetType})`);
      console.log(`   🏷️  Category: ${job.category}`);
      console.log(`   📍 Location: ${job.location || 'Remote'}`);
      console.log(`   👤 Owner: ${job.owner.firstName} ${job.owner.lastName} (${job.owner.email})`);
      console.log(`   📅 Created: ${job.createdAt.toLocaleDateString()}`);
      console.log(`   🔧 Skills: ${job.skills.join(', ')}`);
      console.log(`   📝 Status: ${job.status}`);
      console.log('');
    });

    // Get job statistics
    const stats = await prisma.job.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    console.log('📈 Job Statistics:');
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count.status} jobs`);
    });

  } catch (error) {
    console.error('Error verifying jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyJobs();


