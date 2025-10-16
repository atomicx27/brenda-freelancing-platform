const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sampleJobs = [
  {
    title: "React Developer for E-commerce Website",
    description: "We need an experienced React developer to build a modern e-commerce website with shopping cart, user authentication, and payment integration. The project includes responsive design, product catalog, and admin dashboard.",
    budget: 2500,
    budgetType: "FIXED",
    duration: "4-6 weeks",
    skills: ["React", "JavaScript", "Node.js", "MongoDB", "Stripe API"],
    category: "Web Development",
    subcategory: "Frontend Development",
    location: "New York, NY",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    title: "Mobile App UI/UX Designer",
    description: "Looking for a talented UI/UX designer to create beautiful and intuitive designs for our mobile app. The app is for food delivery service and needs to be user-friendly with modern design principles.",
    budget: 1800,
    budgetType: "FIXED",
    duration: "3-4 weeks",
    skills: ["UI/UX Design", "Figma", "Adobe XD", "Mobile Design", "Prototyping"],
    category: "Design",
    subcategory: "UI/UX Design",
    location: "San Francisco, CA",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000) // 25 days from now
  },
  {
    title: "Python Backend Developer",
    description: "We need a Python developer to build RESTful APIs for our SaaS platform. Experience with Django/FastAPI, PostgreSQL, and cloud deployment is required. The project involves building scalable microservices.",
    budget: 3500,
    budgetType: "FIXED",
    duration: "6-8 weeks",
    skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker", "REST APIs"],
    category: "Web Development",
    subcategory: "Backend Development",
    location: "Austin, TX",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days from now
  },
  {
    title: "Content Writer for Tech Blog",
    description: "We're looking for a skilled content writer to create engaging articles about technology trends, programming tutorials, and industry insights. Must have experience writing for tech audiences.",
    budget: 800,
    budgetType: "FIXED",
    duration: "2-3 weeks",
    skills: ["Content Writing", "Technical Writing", "SEO", "WordPress", "Research"],
    category: "Writing",
    subcategory: "Technical Writing",
    location: "Remote",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
  },
  {
    title: "WordPress Website Development",
    description: "Need a WordPress developer to create a professional business website with custom theme, contact forms, and SEO optimization. The site should be fast, secure, and mobile-responsive.",
    budget: 1200,
    budgetType: "FIXED",
    duration: "2-3 weeks",
    skills: ["WordPress", "PHP", "CSS", "JavaScript", "SEO", "Responsive Design"],
    category: "Web Development",
    subcategory: "CMS Development",
    location: "Chicago, IL",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000) // 18 days from now
  },
  {
    title: "Data Analyst for Marketing Campaign",
    description: "Looking for a data analyst to analyze marketing campaign performance, create reports, and provide insights for optimization. Experience with Google Analytics, SQL, and data visualization tools required.",
    budget: 1500,
    budgetType: "FIXED",
    duration: "3-4 weeks",
    skills: ["Data Analysis", "SQL", "Google Analytics", "Excel", "Tableau", "Marketing Analytics"],
    category: "Data Analysis",
    subcategory: "Marketing Analytics",
    location: "Boston, MA",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000) // 22 days from now
  },
  {
    title: "Logo Design for Startup",
    description: "We need a creative logo design for our new tech startup. The logo should be modern, memorable, and work well across different platforms. Brand colors are blue and white.",
    budget: 300,
    budgetType: "FIXED",
    duration: "1 week",
    skills: ["Logo Design", "Adobe Illustrator", "Branding", "Graphic Design", "Creative Design"],
    category: "Design",
    subcategory: "Graphic Design",
    location: "Remote",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
  },
  {
    title: "Social Media Manager",
    description: "Looking for a social media manager to handle our Instagram, Twitter, and LinkedIn accounts. Must have experience with content creation, community management, and social media analytics.",
    budget: 1000,
    budgetType: "FIXED",
    duration: "4 weeks",
    skills: ["Social Media Marketing", "Content Creation", "Community Management", "Analytics", "Instagram", "LinkedIn"],
    category: "Marketing",
    subcategory: "Social Media Marketing",
    location: "Remote",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 28 days from now
  },
  {
    title: "DevOps Engineer for Cloud Migration",
    description: "We need a DevOps engineer to help migrate our infrastructure to AWS. The project involves setting up CI/CD pipelines, containerization with Docker, and implementing monitoring solutions.",
    budget: 4000,
    budgetType: "FIXED",
    duration: "6-8 weeks",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform", "Monitoring"],
    category: "DevOps",
    subcategory: "Cloud Infrastructure",
    location: "Seattle, WA",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000) // 50 days from now
  },
  {
    title: "Video Editor for YouTube Channel",
    description: "Looking for a skilled video editor to edit educational content for our YouTube channel. Must have experience with Adobe Premiere Pro, color grading, and creating engaging thumbnails.",
    budget: 600,
    budgetType: "FIXED",
    duration: "2 weeks",
    skills: ["Video Editing", "Adobe Premiere Pro", "Color Grading", "Motion Graphics", "YouTube"],
    category: "Video Production",
    subcategory: "Video Editing",
    location: "Remote",
    isRemote: true,
    status: "OPEN",
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
  }
];

async function createSampleUsers() {
  // Create sample client users
  const clients = [
    {
      email: "john.doe@techcorp.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "John",
      lastName: "Doe",
      userType: "CLIENT",
      isVerified: true,
      status: "ACTIVE",
      bio: "Tech entrepreneur with 10+ years of experience in software development.",
      location: "New York, NY"
    },
    {
      email: "sarah.wilson@startup.io",
      password: await bcrypt.hash("password123", 10),
      firstName: "Sarah",
      lastName: "Wilson",
      userType: "CLIENT",
      isVerified: true,
      status: "ACTIVE",
      bio: "Founder of a growing startup focused on mobile applications.",
      location: "San Francisco, CA"
    },
    {
      email: "mike.chen@digital.com",
      password: await bcrypt.hash("password123", 10),
      firstName: "Mike",
      lastName: "Chen",
      userType: "CLIENT",
      isVerified: true,
      status: "ACTIVE",
      bio: "Digital marketing expert and business owner.",
      location: "Austin, TX"
    }
  ];

  const createdClients = [];
  for (const client of clients) {
    try {
      const user = await prisma.user.create({
        data: client
      });
      createdClients.push(user);
      console.log(`Created client: ${user.email}`);
    } catch (error) {
      if (error.code === 'P2002') {
        // User already exists, find them
        const existingUser = await prisma.user.findUnique({
          where: { email: client.email }
        });
        createdClients.push(existingUser);
        console.log(`Using existing client: ${client.email}`);
      } else {
        console.error(`Error creating client ${client.email}:`, error);
      }
    }
  }

  return createdClients;
}

async function createSampleJobs(clients) {
  const jobsPerClient = Math.ceil(sampleJobs.length / clients.length);
  
  for (let i = 0; i < sampleJobs.length; i++) {
    const job = sampleJobs[i];
    const clientIndex = Math.floor(i / jobsPerClient) % clients.length;
    const client = clients[clientIndex];

    try {
      const createdJob = await prisma.job.create({
        data: {
          ...job,
          ownerId: client.id
        }
      });
      console.log(`Created job: ${createdJob.title} (Owner: ${client.email})`);
    } catch (error) {
      console.error(`Error creating job ${job.title}:`, error);
    }
  }
}

async function main() {
  try {
    console.log('Starting to seed sample jobs...');
    
    // Create sample users
    const clients = await createSampleUsers();
    
    // Create sample jobs
    await createSampleJobs(clients);
    
    console.log('Sample jobs seeded successfully!');
  } catch (error) {
    console.error('Error seeding sample jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


