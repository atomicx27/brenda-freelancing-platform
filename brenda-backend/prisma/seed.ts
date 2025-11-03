import prisma from '../src/utils/prisma';

async function seed() {
  console.log('Seeding forum categories and sample posts...');

  const categories = [
    { name: 'General', slug: 'general', description: 'General community discussions', color: '#60A5FA' },
    { name: 'Announcements', slug: 'announcements', description: 'Official announcements and updates', color: '#FBBF24' },
    { name: 'Help & Support', slug: 'help-support', description: 'Ask for help and support', color: '#34D399' },
    { name: 'Jobs & Opportunities', slug: 'jobs-opportunities', description: 'Share jobs and opportunities', color: '#F472B6' }
  ];

  for (const cat of categories) {
    try {
      await prisma.forumCategory.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name, description: cat.description, color: cat.color, isActive: true },
        create: { name: cat.name, slug: cat.slug, description: cat.description, color: cat.color }
      });
      console.log(`Upserted category ${cat.slug}`);
    } catch (err) {
      console.error('Failed to upsert category', cat.slug, err);
    }
  }

  // Create a sample post if none exist
  const postCount = await prisma.forumPost.count();
  if (postCount === 0) {
    // Attempt to find any user to assign as author
    const user = await prisma.user.findFirst();
    const authorId = user ? user.id : undefined;

    const generalCategory = await prisma.forumCategory.findUnique({ where: { slug: 'general' } });

    if (generalCategory && authorId) {
      try {
        await prisma.forumPost.create({
          data: {
            title: 'Welcome to the community! Introduce yourself',
            content: 'Welcome! This is the community forum. Please introduce yourself and share what you are working on.',
            slug: 'welcome-introduce-yourself',
            categoryId: generalCategory.id,
            authorId,
            tags: ['welcome', 'introductions']
          }
        });
        console.log('Created sample post');
      } catch (err) {
        console.error('Failed to create sample post', err);
      }
    } else {
      console.log('Skipping sample post creation: no category or user available');
    }
  } else {
    console.log('Sample posts exist, skipping creation');
  }

  console.log('Seeding complete');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
