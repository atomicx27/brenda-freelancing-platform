# 🚀 Brenda Backend Setup Guide

## Quick Start

### 1. Environment Setup
```bash
# Copy the example configuration
cp config.example .env

# Edit the .env file with your database credentials
# Update DATABASE_URL with your PostgreSQL connection string
```

### 2. Database Setup
```bash
# Install PostgreSQL (if not already installed)
# Create a database named 'brenda_db'

# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push
```

### 3. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🔧 Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/brenda_db"

# JWT Secrets (generate strong secrets for production)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRE="7d"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_REFRESH_EXPIRE="30d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Database Setup

1. **Install PostgreSQL**
   - Download from: https://www.postgresql.org/download/
   - Create a database named `brenda_db`

2. **Update DATABASE_URL**
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/brenda_db"
   ```

3. **Initialize Database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "CLIENT"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }'
```

### Get User Profile (with token)
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Database Schema

The application includes the following main entities:

- **Users**: Basic user information and authentication
- **UserProfiles**: Extended profile information for freelancers
- **Jobs**: Job postings by clients
- **Proposals**: Freelancer proposals for jobs
- **Reviews**: User reviews and ratings
- **Messages**: Communication between users

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Request validation using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Ensure database exists

2. **JWT Secret Error**
   - Make sure JWT_SECRET is set in .env
   - Use a strong, random secret

3. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on the port

4. **Prisma Client Error**
   - Run `npm run db:generate`
   - Check if schema.prisma is valid

### Getting Help

- Check the console output for detailed error messages
- Verify all environment variables are set correctly
- Ensure all dependencies are installed with `npm install`

## 🎯 Next Steps

After successful setup:

1. **Test the API endpoints** using the examples above
2. **Connect your React frontend** to the backend
3. **Implement additional features** like job management, messaging, etc.
4. **Set up production deployment** when ready

## 📝 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |

### System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Health check | No |

---

🎉 **Congratulations!** Your Brenda backend is now ready for development!



