const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  const admins = await prisma.user.findMany({
    where: { userType: 'ADMIN' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      userType: true,
      isVerified: true,
      isActive: true
    }
  });
  
  if (admins.length > 0) {
    console.log('✅ Admin accounts found:');
    admins.forEach(admin => {
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Active: ${admin.isActive}, Verified: ${admin.isVerified}`);
      console.log('');
    });
  } else {
    console.log('❌ No admin accounts found in database');
  }
  
  await prisma.$disconnect();
}

checkAdmin();
