import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin user seeding...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        userType: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminEmail = 'admin@brenda.com';
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN',
        isActive: true,
        isVerified: true,
        profile: {
          create: {
            title: 'Platform Administrator',
            company: 'Brenda Platform',
            experience: 5,
            isVerified: true,
            skills: ['Administration', 'Platform Management', 'User Support'],
            languages: ['English']
          }
        }
      },
      include: {
        profile: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Name:', `${adminUser.firstName} ${adminUser.lastName}`);
    console.log('🏢 Company:', adminUser.profile?.company);
    console.log('⚠️  Please change the default password after first login!');

    // Create additional admin users if needed
    const additionalAdmins = [
      {
        email: 'superadmin@brenda.com',
        password: 'superadmin123',
        firstName: 'Super',
        lastName: 'Admin',
        title: 'Super Administrator'
      }
    ];

    for (const adminData of additionalAdmins) {
      const existingSuperAdmin = await prisma.user.findUnique({
        where: { email: adminData.email }
      });

      if (!existingSuperAdmin) {
        const hashedSuperAdminPassword = await bcrypt.hash(adminData.password, 12);
        
        await prisma.user.create({
          data: {
            email: adminData.email,
            password: hashedSuperAdminPassword,
            firstName: adminData.firstName,
            lastName: adminData.lastName,
            userType: 'ADMIN',
            isActive: true,
            isVerified: true,
            profile: {
              create: {
                title: adminData.title,
                company: 'Brenda Platform',
                experience: 10,
                isVerified: true,
                skills: ['Super Administration', 'Platform Management', 'System Administration'],
                languages: ['English']
              }
            }
          }
        });

        console.log(`✅ Additional admin created: ${adminData.email}`);
        console.log(`🔑 Password: ${adminData.password}`);
      }
    }

    console.log('🎉 Admin seeding completed successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Primary Admin:');
    console.log('  Email: admin@brenda.com');
    console.log('  Password: admin123');
    console.log('\nSuper Admin:');
    console.log('  Email: superadmin@brenda.com');
    console.log('  Password: superadmin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
    console.log('• Change default passwords immediately after first login');
    console.log('• Use strong, unique passwords');
    console.log('• Enable two-factor authentication if available');
    console.log('• Regularly audit admin access logs');
    console.log('• Keep admin credentials secure and confidential');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeding function
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('✅ Admin seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdmin;


