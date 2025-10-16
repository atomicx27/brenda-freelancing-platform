# Brenda - The World's Work Marketplace

A comprehensive freelancing platform built with React, Node.js, and PostgreSQL, inspired by Upwork and Fiverr.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based auth with role-based access control
- **Job Management System** - Create, edit, and manage job postings
- **Proposal System** - Freelancers can apply to jobs with detailed proposals
- **Review & Rating System** - Build trust through user reviews and ratings
- **Real-time Messaging** - Chat between clients and freelancers
- **Analytics Dashboard** - Comprehensive insights for all user types
- **File Upload System** - Profile pictures, portfolios, and document sharing

### User Types
- **Freelancers** - Browse jobs, submit proposals, build reputation
- **Clients** - Post jobs, review proposals, hire freelancers
- **Admins** - Platform management and analytics

### Advanced Features
- **Portfolio Management** - Showcase work with images and descriptions
- **Company Profiles** - Detailed business information and branding
- **Search & Filtering** - Advanced job and freelancer discovery
- **Notification System** - Real-time updates and alerts
- **Responsive Design** - Works seamlessly on all devices

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and context
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Comprehensive icon library
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Modern database ORM
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication
- **Multer** - File upload handling

### Development Tools
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart
- **Concurrently** - Run multiple commands

## 📁 Project Structure

```
brenda/
├── brenda/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts
│   │   ├── services/         # API services
│   │   ├── styles/           # Global styles
│   │   └── utils/            # Utility functions
│   ├── public/               # Static assets
│   └── package.json
│
├── brenda-backend/           # Backend Node.js application
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── utils/            # Utility functions
│   │   └── types/            # TypeScript types
│   ├── prisma/               # Database schema and migrations
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/brenda.git
   cd brenda
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd brenda
   npm install
   
   # Install backend dependencies
   cd ../brenda-backend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd brenda-backend
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/brenda"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRE="7d"
   JWT_REFRESH_SECRET="your-refresh-secret"
   JWT_REFRESH_EXPIRE="30d"
   
   # Server
   PORT=5000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   ```

4. **Database Setup**
   ```bash
   cd brenda-backend
   npx prisma generate
   npx prisma db push
   ```

5. **Start the applications**
   ```bash
   # Start backend (Terminal 1)
   cd brenda-backend
   npm run dev
   
   # Start frontend (Terminal 2)
   cd brenda
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database Studio: `npx prisma studio`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Proposals
- `GET /api/proposals` - Get user proposals
- `POST /api/proposals` - Submit proposal
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal

### Reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Analytics
- `GET /api/analytics/freelancer` - Freelancer analytics
- `GET /api/analytics/client` - Client analytics
- `GET /api/analytics/admin` - Admin analytics

### Messages
- `GET /api/messages/conversations` - Get conversations
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation

## 🎯 Key Features Implemented

### ✅ Job Management
- Create and edit job postings
- Advanced search and filtering
- Job categories and subcategories
- Budget and timeline management

### ✅ Proposal System
- Detailed proposal submission
- Proposal status tracking
- Client proposal management
- Freelancer proposal history

### ✅ Review & Rating System
- 5-star rating system
- Detailed review comments
- Review statistics and analytics
- Review moderation system

### ✅ Messaging System
- Real-time chat interface
- File sharing capabilities
- Message notifications
- Conversation management

### ✅ Analytics Dashboard
- **Freelancer Dashboard** - Earnings, job stats, performance metrics
- **Client Dashboard** - Spending, project metrics, business insights
- **Admin Dashboard** - Platform health, user analytics, system monitoring

### ✅ User Management
- Role-based access control
- Profile management
- Portfolio showcase
- Company profiles

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- SQL injection prevention
- XSS protection

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interface
- Cross-browser compatibility

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd brenda
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
cd brenda-backend
npm run build
# Deploy with environment variables
```

### Database (Supabase/Railway)
- Set up PostgreSQL database
- Update DATABASE_URL in environment
- Run migrations: `npx prisma db push`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Upwork and Fiverr
- Built with modern web technologies
- Designed for scalability and performance

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

---

**Brenda** - Connecting talent with opportunity, one project at a time. 🌟
