# Brenda Backend API

Backend API for Brenda - The World's Work Marketplace built with Node.js, TypeScript, Express, and Prisma.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user registration, login, and profile management
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Security**: Helmet, CORS, rate limiting, input validation
- **TypeScript**: Full TypeScript support for better development experience

## 📋 Prerequisites

- Node.js (v18 or higher)
- Supabase account (recommended) or PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brenda-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp config.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database (Supabase recommended)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   
   # JWT
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRE="7d"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
   JWT_REFRESH_EXPIRE="30d"
   
   # Server
   PORT=5000
   NODE_ENV="development"
   FRONTEND_URL="http://localhost:3000"
   ```
   
   **📖 For detailed Supabase setup, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # (Optional) Open Prisma Studio
   npm run db:studio
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Users
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Health Check
- `GET /health` - API health check

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

The application uses the following main entities:
- **Users**: Basic user information and authentication
- **UserProfiles**: Extended profile information for freelancers
- **Jobs**: Job postings by clients
- **Proposals**: Freelancer proposals for jobs
- **Reviews**: User reviews and ratings
- **Messages**: Communication between users

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation using express-validator
- **Password Hashing**: bcrypt for secure password storage
- **JWT**: Secure token-based authentication

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🏗️ Project Structure

```
src/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── models/          # Database models (Prisma)
└── index.ts         # Application entry point
```

## 🚀 Supabase Integration

This backend is optimized for Supabase and includes:

- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Ready for real-time messaging and notifications
- **Storage**: File upload utilities for avatars and portfolios
- **Authentication**: Can integrate with Supabase Auth (optional)
- **Monitoring**: Built-in analytics and logging

### Supabase Features Available:
- ✅ **Real-time subscriptions** for messaging
- ✅ **File storage** for user uploads
- ✅ **Built-in authentication** (alternative to JWT)
- ✅ **Auto-generated APIs** (REST & GraphQL)
- ✅ **Database management** dashboard
- ✅ **Analytics** and monitoring

## 🔄 Next Steps

- [ ] Set up Supabase project (see SUPABASE_SETUP.md)
- [ ] Implement job management endpoints
- [ ] Add proposal system
- [ ] Implement real-time messaging with Supabase
- [ ] Add file upload functionality
- [ ] Implement payment integration
- [ ] Add email notifications
- [ ] Implement search and filtering
- [ ] Add admin panel endpoints

## 📄 License

This project is licensed under the ISC License.
