const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  console.log('🔐 Creating admin account...\n');
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@brenda.com' }
  });
  
  if (existingAdmin) {
    console.log('✅ Admin account already exists!');
    console.log('   Email: admin@brenda.com');
    console.log('   Password: Admin@12345');
    await prisma.$disconnect();
    return;
  }
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@12345', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@brenda.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      userType: 'ADMIN',
      isVerified: true,
      isActive: true,
      status: 'ACTIVE',
      bio: 'Platform Administrator',
      location: 'Platform HQ',
      profile: {
        create: {
          title: 'Platform Administrator',
          company: 'Brenda Platform',
          skills: ['Platform Management', 'User Support', 'Content Moderation'],
          languages: ['English'],
          availability: 'FULL_TIME',
          isVerified: true
        }
      }
    }
  });
  
  console.log('✅ Admin account created successfully!\n');
  console.log('📧 Email: admin@brenda.com');
  console.log('🔑 Password: Admin@12345');
  console.log('👤 Name: Admin User');
  console.log('🎯 Role: ADMIN\n');
  
  await prisma.$disconnect();
}

createAdmin()
  .catch((error) => {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  });
