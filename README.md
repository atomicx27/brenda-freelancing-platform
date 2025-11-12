# 🚀 Brenda - The World's Work Marketplace

<div align="center">

![Brenda Platform](https://img.shields.io/badge/Platform-Brenda-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-yellow?style=for-the-badge)

**A next-generation freelancing marketplace connecting talent with opportunity**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Welcome to Brenda

Brenda is a comprehensive, full-stack freelancing platform inspired by Upwork, built with modern technologies and designed to revolutionize how freelancers and clients connect, collaborate, and succeed together. With over **50,000 lines of carefully crafted code**, Brenda offers a feature-rich ecosystem that supports every aspect of the freelancing workflow.

### 💡 Why Brenda?

- **🎯 Smart Matching**: AI-powered job matching and applicant comparison
- **🤖 Intelligent Automation**: Workflow automation for emails, invoicing, and status updates
- **🌐 Complete Ecosystem**: Everything you need in one platform
- **🔒 Enterprise-Grade Security**: JWT authentication, rate limiting, and comprehensive security measures
- **📱 Modern UI/UX**: Beautiful, responsive design with smooth animations
- **⚡ Lightning Fast**: Built with Vite and optimized for performance

---

## ✨ Features

### 👥 **User Management & Authentication**
- 🔐 Secure JWT-based authentication with refresh tokens
- 👤 Dual user types: Freelancers & Clients
- 📋 Comprehensive user profiles with skills, experience, and portfolio
- 🏢 Company profiles for business clients
- ✅ Email verification and account management
- 🔑 Role-based access control (RBAC)
- 👨‍💼 Admin panel for platform management

### 💼 **Core Marketplace Features**
- 📝 **Job Posting & Management**: Create, edit, and manage job listings with detailed requirements
- 💰 **Proposals & Bidding**: Freelancers can submit proposals with custom pricing and timelines
- 📊 **Smart Contracts**: Blockchain-inspired contract management for projects
- 💳 **Invoicing System**: Automated invoice generation and tracking
- ⭐ **Review & Rating System**: Mutual feedback between clients and freelancers
- 🔍 **Advanced Search**: Filter jobs by category, budget, skills, and location

### 🎨 **Portfolio & Showcase**
- 🖼️ Rich portfolio items with images and project details
- 📄 Document uploads (PDFs, images) via Cloudinary integration
- 👀 Portfolio view tracking and analytics
- ❤️ Like and engagement features
- 🌐 Public portfolio pages with custom URLs
- 🎯 Featured projects and display ordering
- 📊 Resume parsing with AI-powered skill extraction

### 💬 **Communication & Collaboration**
- 📨 Real-time messaging system between users
- 💡 Forum & Discussion Boards
- 📢 Community features with posts, comments, and reactions
- 👥 User Groups with moderation tools
- 🔔 Smart notification system
- 📧 Email campaigns and newsletters

### 🎓 **Mentorship Program**
- 👨‍🏫 Mentor application and approval system
- 🤝 Mentorship matching (mentor-mentee connections)
- 📅 Session scheduling and tracking
- 📈 Progress monitoring and feedback
- 🏆 Mentor verification badges

### 🤖 **AI & Automation**
- 🧠 **AI-Powered Features**:
  - Google Gemini integration for content enhancement
  - Job description generation
  - Proposal writing assistance
  - Resume analysis and skill extraction
  - Applicant comparison and ranking

- ⚙️ **Workflow Automation**:
  - 8 automation types (Email, Follow-ups, Invoicing, Lead Scoring, etc.)
  - 4 trigger types (Scheduled, Event-Based, Condition-Based, Manual)
  - Automated email campaigns
  - Invoice reminders
  - Contract generation
  - Status update notifications
  - Custom automation rules

### 📊 **Analytics & Monitoring**
- 📈 System health monitoring dashboard
- 📉 Performance metrics and KPIs
- 📊 User analytics and engagement tracking
- 🔍 Lead scoring system
- 📱 Real-time activity logs
- 🎯 Conversion tracking

### 🎨 **Additional Features**
- 🎨 Service categories (Logo Design, Video Editing, SEO, WordPress, etc.)
- 📱 Responsive design for all devices
- 🌙 Beautiful UI with Tailwind CSS and Framer Motion animations
- 📋 Staffing and enterprise solutions
- 🏆 Success stories showcase
- 🔐 Advanced security with Helmet.js
- ⚡ Rate limiting and DDoS protection
- 📁 File upload handling with Cloudinary

---

## 🛠️ Tech Stack

### **Frontend** (`/brenda`)
```
⚛️  React 18.2.0          - Modern UI framework
⚡  Vite 4.2.0            - Next-gen build tool
🎨  Tailwind CSS 3.1.8    - Utility-first CSS
✨  Framer Motion 7.3.2   - Smooth animations
🧭  React Router 6.8.1    - Client-side routing
🎯  React Icons 4.4.0     - Icon library
📅  date-fns 4.1.0        - Date manipulation
```

### **Backend** (`/brenda-backend`)
```
🟢  Node.js + TypeScript  - Type-safe backend
🚂  Express 5.1.0         - Web framework
🗄️  PostgreSQL + Prisma   - Database & ORM
🔐  JWT + bcryptjs        - Authentication
🧠  Google Gemini AI      - AI integration
☁️  Cloudinary            - Media management
📧  Resend                - Email service
🔒  Helmet + CORS         - Security
⚡  Rate Limiting          - API protection
✅  Jest + Supertest      - Testing framework
```

### **Database Schema** (Prisma)
```
📊  18+ Models including:
    - Users & Profiles
    - Jobs & Proposals
    - Portfolio Items
    - Messages & Reviews
    - Smart Contracts
    - Automation Rules
    - Community Features
    - Mentorship System
    - Analytics & Monitoring
```

---

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **PostgreSQL** database (Supabase recommended)
- **Cloudinary** account (for file uploads)
- **Google Gemini API** key (for AI features)
- **Resend API** key (for emails)

### 📦 Installation

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/atomicx27/brenda-freelancing-platform.git
cd brenda-freelancing-platform
```

#### 2️⃣ Setup Backend
```bash
cd brenda-backend

# Install dependencies
npm install

# Create environment file
cp config.example .env

# Edit .env with your configuration:
# - DATABASE_URL (PostgreSQL/Supabase)
# - JWT_SECRET & JWT_REFRESH_SECRET
# - CLOUDINARY credentials
# - GEMINI_API_KEY
# - RESEND_API_KEY
# - etc.

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# (Optional) Seed database
npm run db:seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

#### 3️⃣ Setup Frontend
```bash
cd brenda

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 🔧 Environment Variables

#### Backend (`.env`)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/brenda"
DIRECT_URL="postgresql://user:password@host:5432/brenda"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRE="7d"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRE="30d"

# Server
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Google Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"
```

---

## 📁 Project Structure

```
brenda-freelancing-platform/
│
├── 📁 brenda/                          # Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/              # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProposalForm.jsx
│   │   │   ├── PortfolioCard.jsx
│   │   │   ├── AutomationDashboard.jsx
│   │   │   └── ... (50+ components)
│   │   │
│   │   ├── 📁 pages/                   # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TalentMarketplace.jsx
│   │   │   ├── Portfolio.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── AutomationDashboard.jsx
│   │   │   ├── 📁 account-security/    # Auth pages
│   │   │   ├── 📁 jobs/                # Job pages
│   │   │   ├── 📁 services/            # Service pages
│   │   │   ├── 📁 staffing/            # Staffing pages
│   │   │   └── 📁 enterprise/          # Enterprise pages
│   │   │
│   │   ├── 📁 contexts/                # React contexts
│   │   ├── 📁 services/                # API services
│   │   ├── 📁 utils/                   # Utility functions
│   │   ├── 📁 styles/                  # Global styles
│   │   ├── App.jsx                     # Root component
│   │   └── main.jsx                    # Entry point
│   │
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── README.md
│
├── 📁 brenda-backend/                  # Backend API
│   ├── 📁 src/
│   │   ├── 📁 controllers/             # Route controllers
│   │   │   ├── authController.ts
│   │   │   ├── jobController.ts
│   │   │   ├── portfolioController.ts
│   │   │   ├── automationController.ts
│   │   │   └── ... (20+ controllers)
│   │   │
│   │   ├── 📁 routes/                  # API routes
│   │   │   ├── auth.ts                 # /api/auth/*
│   │   │   ├── jobs.ts                 # /api/jobs/*
│   │   │   ├── portfolio.ts            # /api/portfolio/*
│   │   │   ├── automation.ts           # /api/automation/*
│   │   │   ├── ai.ts                   # /api/ai/*
│   │   │   ├── community.ts            # /api/community/*
│   │   │   └── ... (19 route files)
│   │   │
│   │   ├── 📁 middleware/              # Express middleware
│   │   │   ├── auth.ts
│   │   │   ├── validate.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── upload.ts
│   │   │
│   │   ├── 📁 services/                # Business logic
│   │   │   ├── scheduler.ts            # Automation scheduler
│   │   │   ├── emailService.ts
│   │   │   ├── aiService.ts
│   │   │   └── eventBus.ts
│   │   │
│   │   ├── 📁 types/                   # TypeScript types
│   │   ├── 📁 utils/                   # Utilities
│   │   └── index.ts                    # Entry point
│   │
│   ├── 📁 prisma/                      # Database schema
│   │   ├── schema.prisma               # 18+ models
│   │   └── seed.ts
│   │
│   ├── 📁 tests/                       # Test files
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── 📁 docs/                            # Documentation
│   ├── AUTOMATION_IMPLEMENTATION_GUIDE.md
│   ├── SUPABASE_SETUP.md
│   ├── ADMIN_SYSTEM_GUIDE.md
│   ├── PORTFOLIO_API_DOCUMENTATION.md
│   └── ... (more guides)
│
├── .gitignore
└── README.md                           # This file!
```

---

## 📚 Documentation

- **[Backend Setup Guide](./brenda-backend/SETUP.md)** - Detailed backend setup
- **[Supabase Setup](./brenda-backend/SUPABASE_SETUP.md)** - Database configuration
- **[Automation Guide](./docs/AUTOMATION_IMPLEMENTATION_GUIDE.md)** - Workflow automation system
- **[Admin System](./docs/ADMIN_SYSTEM_GUIDE.md)** - Admin panel usage
- **[Portfolio API](./docs/PORTFOLIO_API_DOCUMENTATION.md)** - Portfolio endpoints
- **[Contributing Guide](./brenda/CONTRIBUTING.md)** - How to contribute
- **[Error Handling](./brenda/ERROR_HANDLING_GUIDE.md)** - Error handling patterns

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
```
POST   /register              Register new user
POST   /login                 Login user
GET    /me                    Get current user
POST   /refresh               Refresh access token
POST   /logout                Logout user
```

### Jobs (`/api/jobs`)
```
GET    /                      List all jobs
POST   /                      Create new job
GET    /:id                   Get job details
PUT    /:id                   Update job
DELETE /:id                   Delete job
GET    /:id/proposals         Get job proposals
POST   /:id/match-insights    Get AI job matching insights
```

### Portfolio (`/api/portfolio`)
```
GET    /                      Get user portfolio items
POST   /                      Create portfolio item
GET    /:id                   Get portfolio item details
PUT    /:id                   Update portfolio item
DELETE /:id                   Delete portfolio item
POST   /:id/documents         Upload portfolio documents
GET    /public/:username      Get public portfolio
POST   /:id/like              Like portfolio item
POST   /:id/view              Track portfolio view
```

### Automation (`/api/automation`)
```
GET    /rules                 List automation rules
POST   /rules                 Create automation rule
GET    /rules/:id             Get rule details
PUT    /rules/:id             Update rule
DELETE /rules/:id             Delete rule
POST   /rules/:id/execute     Manually execute rule
GET    /logs                  Get automation logs
```

### AI Features (`/api/ai`)
```
POST   /enhance-job           Enhance job description
POST   /enhance-proposal      Enhance proposal content
POST   /extract-skills        Extract skills from resume
POST   /compare-applicants    Compare job applicants
```

### Community (`/api/community`)
```
GET    /forum/posts           Get forum posts
POST   /forum/posts           Create forum post
GET    /forum/posts/:id       Get post details
POST   /forum/posts/:id/comments  Add comment
GET    /groups                List user groups
POST   /groups                Create group
GET    /events                List events
POST   /events/:id/attend     Register for event
```

**...and 15+ more endpoint groups!**

See [API Documentation](./docs/) for complete endpoint reference.

---

## 🧪 Testing

### Backend Tests
```bash
cd brenda-backend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Frontend Tests
```bash
cd brenda

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎨 Key Features in Detail

### 🤖 Automation System
The automation system supports sophisticated workflow automation with:
- **8 Automation Types**: Email Marketing, Follow-ups, Invoicing, Lead Scoring, Contract Management, Reminders, Status Updates, Custom
- **Multiple Triggers**: Scheduled (cron-like), Event-based, Condition-based, Manual
- **Template Variables**: Dynamic content in emails and documents
- **Action Chaining**: Multiple actions per automation rule
- **Monitoring & Logs**: Track all automation executions
- **60-second scheduler**: Background worker for scheduled automations

### 🧠 AI Integration
Powered by Google Gemini AI:
- **Job Description Enhancement**: Make job posts more appealing
- **Proposal Writing Assistant**: Help freelancers write better proposals
- **Resume Parsing**: Extract skills, experience, and achievements
- **Applicant Comparison**: AI-powered candidate ranking
- **Content Generation**: Generate professional content
- **Smart Matching**: Match freelancers to jobs using AI

### 📊 Portfolio System
Professional portfolio management:
- **Rich Media**: Upload images, PDFs, and documents
- **Public Portfolios**: Shareable public URLs
- **Analytics**: Track views and engagement
- **Featured Items**: Highlight best work
- **Categories & Tags**: Organize projects
- **Resume Integration**: Parse and display resume data

### 👥 Community Features
Build connections and engagement:
- **Forum Discussions**: Topic-based discussions
- **User Groups**: Create and join communities
- **Events**: Virtual and physical event management
- **Social Connections**: Network with other users
- **Content Sharing**: Share posts and articles
- **Reactions & Comments**: Engage with content

---

## 🚀 Deployment

### Backend Deployment
```bash
cd brenda-backend

# Build TypeScript
npm run build

# Start production server
npm start
```

**Recommended hosting**: Heroku, Railway, Render, AWS, or DigitalOcean

### Frontend Deployment
```bash
cd brenda

# Build for production
npm run build

# The 'dist' folder is ready to deploy
```

**Recommended hosting**: Vercel, Netlify, Cloudflare Pages, or AWS S3 + CloudFront

### Database
**Recommended**: Supabase (PostgreSQL with real-time features)
- See [SUPABASE_SETUP.md](./brenda-backend/SUPABASE_SETUP.md)
- Alternative: AWS RDS, Heroku Postgres, Railway

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

See [CONTRIBUTING.md](./brenda/CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgments

- Inspired by **Upwork** and modern freelancing platforms
- Built with ❤️ using open-source technologies
- Special thanks to all contributors

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/atomicx27/brenda-freelancing-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/atomicx27/brenda-freelancing-platform/discussions)

---

## 🎯 Roadmap

### ✅ Completed
- [x] User authentication & authorization
- [x] Job posting & proposal system
- [x] Portfolio management
- [x] Real-time messaging
- [x] Review & rating system
- [x] AI-powered features
- [x] Workflow automation
- [x] Community features
- [x] Mentorship program
- [x] Admin panel

### 🚧 In Progress
- [ ] Payment integration (Stripe/PayPal)
- [ ] Video calling for interviews
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Blockchain integration for payments

### 💭 Future Plans
- [ ] Multi-language support (i18n)
- [ ] Advanced search with Elasticsearch
- [ ] Time tracking for projects
- [ ] Contract templates library
- [ ] Integration marketplace (Slack, Jira, etc.)

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with 💻 and ☕ by the Brenda Team**

![Made with Love](https://img.shields.io/badge/Made%20with-Love-red?style=for-the-badge&logo=heart)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green?style=for-the-badge&logo=github)

</div>
