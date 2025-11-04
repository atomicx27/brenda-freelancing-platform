const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...\n');
    
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Total users found: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('Recent users:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.userType}) - ID: ${user.id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No users found in database!');
      console.log('Run: npm run seed to create initial users');
    }

    const adminCount = await prisma.user.count({
      where: { userType: 'ADMIN' }
    });
    
    console.log(`\nAdmin users: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('⚠️  No admin users found! You need to create an admin user.');
    }

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
