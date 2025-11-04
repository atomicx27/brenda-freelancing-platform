const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMentorships() {
  try {
    // Get users to work with
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: {
          select: {
            title: true,
            experience: true,
            skills: true
          }
        }
      }
    });

    console.log(`Found ${users.length} users`);
    
    if (users.length < 2) {
      console.log('Need at least 2 users to create mentorships');
      return;
    }

    // Create sample mentorships
    const mentorshipData = [
      {
        mentorId: users[0].id,
        menteeId: users[1].id,
        title: 'Full Stack Development Mentorship',
        description: 'Learn modern web development with React, Node.js, and databases',
        category: 'Web Development',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        status: 'ACTIVE',
        isActive: true
      },
      {
        mentorId: users[0].id,
        menteeId: users.length > 2 ? users[2].id : users[1].id,
        title: 'UI/UX Design Fundamentals',
        description: 'Master design principles and tools like Figma',
        category: 'Design',
        skills: ['UI Design', 'UX Research', 'Figma', 'Prototyping'],
        status: 'ACTIVE',
        isActive: true
      },
      {
        mentorId: users.length > 1 ? users[1].id : users[0].id,
        menteeId: users.length > 3 ? users[3].id : users[0].id,
        title: 'DevOps & Cloud Infrastructure',
        description: 'Learn AWS, Docker, and CI/CD best practices',
        category: 'DevOps',
        skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'],
        status: 'PENDING',
        isActive: true
      },
      {
        mentorId: users.length > 2 ? users[2].id : users[0].id,
        menteeId: users[0].id,
        title: 'Mobile App Development',
        description: 'Build cross-platform mobile apps with React Native',
        category: 'Mobile Development',
        skills: ['React Native', 'iOS', 'Android', 'Mobile UI'],
        status: 'ACTIVE',
        isActive: true
      },
      {
        mentorId: users.length > 1 ? users[1].id : users[0].id,
        menteeId: users.length > 4 ? users[4].id : users[0].id,
        title: 'Data Science & Machine Learning',
        description: 'Introduction to Python, data analysis, and ML algorithms',
        category: 'Data Science',
        skills: ['Python', 'Machine Learning', 'Data Analysis', 'TensorFlow'],
        status: 'ACTIVE',
        isActive: true
      }
    ];

    console.log('Creating mentorships...');
    
    for (const data of mentorshipData) {
      const mentorship = await prisma.mentorship.create({
        data,
        include: {
          mentor: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          mentee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      console.log(`✓ Created: ${mentorship.title} (${mentorship.mentor.firstName} → ${mentorship.mentee.firstName})`);
    }

    console.log('\n✅ Successfully seeded mentorships!');
  } catch (error) {
    console.error('Error seeding mentorships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMentorships();
