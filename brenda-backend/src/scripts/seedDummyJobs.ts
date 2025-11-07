import prisma from '../utils/prisma';

async function main(): Promise<void> {
  // TODO: Replace with the id of an existing CLIENT user from your database.
  const ownerId = process.env.DUMMY_JOB_OWNER_ID || '';

  if (!ownerId) {
    console.error('❌  No ownerId provided. Set DUMMY_JOB_OWNER_ID or hardcode an id before running.');
    process.exit(1);
  }

  const jobs = [
    {
      title: 'AI Data Pipeline Specialist',
      description: 'Build robust ETL flows, integrate Snowflake, and productionize ML feature stores.',
      budget: 5200,
      budgetType: 'FIXED',
      duration: '8 weeks',
      skills: ['Python', 'Airflow', 'Snowflake', 'ML Ops'],
      category: 'Data Engineering',
      subcategory: 'Pipelines',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-10'),
      ownerId
    },
    {
      title: 'UX Research Sprint Lead',
      description: 'Conduct remote studies, synthesize personas, and deliver actionable UX strategy.',
      budget: 70,
      budgetType: 'HOURLY',
      duration: '6 weeks',
      skills: ['UX Research', 'Figma', 'User Interviews', 'Journey Mapping'],
      category: 'Design & Creative',
      subcategory: 'UX/UI',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-01-24'),
      ownerId
    },
    {
      title: 'E-commerce Conversion Copywriter',
      description: 'Rewrite product pages, create email flows, and A/B test headlines for higher conversion.',
      budget: 2800,
      budgetType: 'FIXED',
      duration: '4 weeks',
      skills: ['Copywriting', 'Klaviyo', 'A/B Testing', 'SEO'],
      category: 'Marketing & Sales',
      subcategory: 'Content Marketing',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-05'),
      ownerId
    },
    {
      title: 'Next.js SaaS Dashboard Engineer',
      description: 'Implement multi-tenant dashboards with role-based access and Stripe billing integrations.',
      budget: 6200,
      budgetType: 'FIXED',
      duration: '7 weeks',
      skills: ['Next.js', 'TypeScript', 'TailwindCSS', 'Stripe'],
      category: 'Frontend Development',
      subcategory: 'SaaS',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-03-01'),
      ownerId
    },
    {
      title: 'Serverless API Refactor',
      description: 'Migrate Node services to AWS Lambda, add observability, and tighten security.',
      budget: 85,
      budgetType: 'HOURLY',
      duration: '10 weeks',
      skills: ['AWS Lambda', 'Node.js', 'DynamoDB', 'CloudWatch'],
      category: 'Backend Development',
      subcategory: 'Serverless',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-03-12'),
      ownerId
    },
    {
      title: 'Mobile AR Prototype Developer',
      description: 'Create AR prototype for interior design with surface detection and 3D asset rendering.',
      budget: 7600,
      budgetType: 'FIXED',
      duration: '6 weeks',
      skills: ['Unity', 'ARKit', 'ARCore', '3D Modeling'],
      category: 'Mobile Development',
      subcategory: 'Augmented Reality',
      location: 'Hybrid - New York, NY',
      isRemote: false,
      deadline: new Date('2025-02-20'),
      ownerId
    },
    {
      title: 'Growth Analytics Consultant',
      description: 'Instrument product analytics, define KPIs, and build Looker dashboards for stakeholders.',
      budget: 95,
      budgetType: 'HOURLY',
      duration: '5 weeks',
      skills: ['Amplitude', 'SQL', 'Looker', 'Product Analytics'],
      category: 'Data Science & Analytics',
      subcategory: 'Product Analytics',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-01-30'),
      ownerId
    },
    {
      title: 'Comprehensive Brand Identity Package',
      description: 'Deliver brand guidelines, logo suite, typography system, and social templates.',
      budget: 3400,
      budgetType: 'FIXED',
      duration: '3 weeks',
      skills: ['Branding', 'Illustrator', 'InDesign', 'Strategy'],
      category: 'Design & Creative',
      subcategory: 'Brand Identity',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-01-22'),
      ownerId
    },
    {
      title: 'International SEO Strategist',
      description: 'Localize site structure, implement hreflang, and orchestrate multilingual content calendar.',
      budget: 68,
      budgetType: 'HOURLY',
      duration: '12 weeks',
      skills: ['SEO', 'Content Strategy', 'Ahrefs', 'Technical SEO'],
      category: 'Marketing & Sales',
      subcategory: 'SEO',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-03-18'),
      ownerId
    },
    {
      title: 'Customer Success Playbook Author',
      description: 'Draft onboarding sequences, escalation matrices, and success metrics dashboards.',
      budget: 2100,
      budgetType: 'FIXED',
      duration: '5 weeks',
      skills: ['CX Strategy', 'Notion', 'Process Design', 'Analytics'],
      category: 'Business & Operations',
      subcategory: 'Customer Success',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-14'),
      ownerId
    },
    {
      title: 'Kubernetes Cost Optimization Engineer',
      description: 'Tune autoscaling, right-size workloads, and implement cost monitoring via Datadog.',
      budget: 110,
      budgetType: 'HOURLY',
      duration: '8 weeks',
      skills: ['Kubernetes', 'Helm', 'Datadog', 'FinOps'],
      category: 'DevOps & Infrastructure',
      subcategory: 'Cloud Optimization',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-28'),
      ownerId
    },
    {
      title: 'Salesforce Lightning Migration Specialist',
      description: 'Migrate classic org, configure flows, and enable CPQ for the sales team.',
      budget: 8800,
      budgetType: 'FIXED',
      duration: '9 weeks',
      skills: ['Salesforce', 'Lightning', 'CPQ', 'Apex'],
      category: 'CRM & ERP',
      subcategory: 'Salesforce',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-03-05'),
      ownerId
    },
    {
      title: 'Cybersecurity Incident Response Lead',
      description: 'Develop runbooks, perform tabletop exercises, and integrate SIEM alerts with Slack.',
      budget: 120,
      budgetType: 'HOURLY',
      duration: '6 weeks',
      skills: ['Incident Response', 'SIEM', 'Splunk', 'NIST'],
      category: 'IT & Security',
      subcategory: 'Security Operations',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-07'),
      ownerId
    },
    {
      title: 'AI-Powered Support Chatbot Builder',
      description: 'Train GPT-based assistant, integrate with Zendesk, and craft escalation logic.',
      budget: 5400,
      budgetType: 'FIXED',
      duration: '5 weeks',
      skills: ['Python', 'LangChain', 'Zendesk', 'Prompt Engineering'],
      category: 'AI & Automation',
      subcategory: 'Conversational AI',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-03'),
      ownerId
    },
    {
      title: 'Blockchain Smart Contract Auditor',
      description: 'Audit Solidity contracts, improve test coverage, and document threat models.',
      budget: 9800,
      budgetType: 'FIXED',
      duration: '4 weeks',
      skills: ['Solidity', 'Hardhat', 'Security Audit', 'Foundry'],
      category: 'Blockchain & Web3',
      subcategory: 'Security',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-25'),
      ownerId
    },
    {
      title: 'Video Content Repurposing Editor',
      description: 'Turn webinar recordings into social clips, add captions, and optimize for engagement.',
      budget: 1900,
      budgetType: 'FIXED',
      duration: '3 weeks',
      skills: ['Adobe Premiere', 'After Effects', 'Content Strategy', 'Captioning'],
      category: 'Design & Creative',
      subcategory: 'Video Production',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-01-27'),
      ownerId
    },
    {
      title: 'Global Payroll Implementation Consultant',
      description: 'Configure Deel workflows, ensure compliance across regions, and train HR stakeholders.',
      budget: 72,
      budgetType: 'HOURLY',
      duration: '10 weeks',
      skills: ['Payroll', 'Compliance', 'HRIS', 'Deel'],
      category: 'Business & Operations',
      subcategory: 'HR & People Ops',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-03-22'),
      ownerId
    },
    {
      title: 'Educational Course Illustrator',
      description: 'Create illustrated assets, motion graphics snippets, and course slide templates.',
      budget: 2600,
      budgetType: 'FIXED',
      duration: '4 weeks',
      skills: ['Illustration', 'Motion Graphics', 'After Effects', 'Storyboarding'],
      category: 'Design & Creative',
      subcategory: 'Illustration',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-11'),
      ownerId
    },
    {
      title: 'IoT Edge Firmware Engineer',
      description: 'Optimize low-power firmware, add OTA updates, and implement MQTT telemetry reporting.',
      budget: 8900,
      budgetType: 'FIXED',
      duration: '8 weeks',
      skills: ['C++', 'RTOS', 'MQTT', 'Embedded Systems'],
      category: 'Hardware & IoT',
      subcategory: 'Firmware',
      location: 'Onsite - Austin, TX',
      isRemote: false,
      deadline: new Date('2025-03-08'),
      ownerId
    },
    {
      title: 'Enterprise HubSpot RevOps Architect',
      description: 'Design revenue operations architecture, automate funnels, and build analytics dashboards.',
      budget: 6400,
      budgetType: 'FIXED',
      duration: '7 weeks',
      skills: ['HubSpot', 'RevOps', 'Automation', 'SQL'],
      category: 'Marketing & Sales',
      subcategory: 'Revenue Operations',
      location: 'Remote',
      isRemote: true,
      deadline: new Date('2025-02-18'),
      ownerId
    }
  ];

  const result = await prisma.job.createMany({ data: jobs });
  console.log(`✅  Inserted ${result.count} dummy jobs for owner ${ownerId}`);
}

main()
  .catch((error) => {
    console.error('❌  Failed to seed dummy jobs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default main;

