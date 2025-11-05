const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user for automation testing...\n');

    const hashedPassword = await bcrypt.hash('Test@12345', 10);

    const user = await prisma.user.upsert({
      where: { email: 'testuser@brenda.com' },
      update: {
        password: hashedPassword
      },
      create: {
        email: 'testuser@brenda.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        userType: 'FREELANCER',
        isActive: true,
        profile: {
          create: {
            title: 'Software Developer',
            hourlyRate: 50.0,
            availability: 'FULL_TIME',
            experience: 5,
            isVerified: true,
            skills: ['JavaScript', 'React', 'Node.js'],
            languages: ['English']
          }
        }
      },
      include: {
        profile: true
      }
    });

    console.log('✓ Test user created/updated successfully!');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: Test@12345`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Type: ${user.userType}`);
    console.log(`  Verified: ${user.profile?.isVerified || false}`);
    console.log('\nYou can now use these credentials for testing.');

  } catch (error) {
    console.error('Error creating test user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
