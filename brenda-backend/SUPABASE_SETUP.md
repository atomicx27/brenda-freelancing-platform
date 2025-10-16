# 🚀 Supabase Setup Guide for Brenda Backend

## Why Supabase?

Supabase is perfect for your Brenda platform because it provides:
- ✅ **PostgreSQL Database** - Fully compatible with Prisma
- ✅ **Real-time Features** - Perfect for messaging and notifications
- ✅ **File Storage** - For user avatars and portfolio images
- ✅ **Built-in Auth** - Can complement your JWT system
- ✅ **Auto-generated APIs** - Bonus REST and GraphQL APIs
- ✅ **Free Tier** - Great for development and small projects

## 📋 Step-by-Step Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: `brenda-backend`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**

### 2. Get Database Connection String

1. Go to **Settings** → **Database**
2. Scroll down to **"Connection string"**
3. Copy the **URI** connection string
4. It will look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Update Environment Variables

Create your `.env` file:

```bash
cd brenda-backend
cp config.example .env
```

Edit `.env` file with your Supabase credentials:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT
JWT_SECRET="brenda-super-secret-jwt-key-2024-development"
JWT_EXPIRE="7d"
JWT_REFRESH_SECRET="brenda-super-secret-refresh-key-2024-development"
JWT_REFRESH_EXPIRE="30d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Supabase API Keys (for future features)
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase database
npm run db:push
```

### 5. Test Connection

```bash
# Start development server
npm run dev
```

Test the health endpoint:
```bash
curl http://localhost:5000/health
```

## 🔧 Supabase Dashboard Features

### Database Management
- **Table Editor**: View and edit your tables
- **SQL Editor**: Run custom SQL queries
- **Database Logs**: Monitor database activity

### Authentication (Optional)
- **User Management**: Built-in user authentication
- **Social Auth**: Google, GitHub, etc.
- **Email Templates**: Customizable email templates

### Storage (Future Use)
- **File Uploads**: For user avatars, portfolio images
- **CDN**: Fast file delivery
- **Image Transformations**: Automatic image resizing

### Real-time (Future Use)
- **Subscriptions**: Real-time data updates
- **Presence**: See who's online
- **Broadcasting**: Send messages to multiple users

## 🚀 Advanced Supabase Features (Future Implementation)

### 1. Real-time Messaging
```typescript
// Future: Real-time messaging with Supabase
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Subscribe to new messages
supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()
```

### 2. File Storage
```typescript
// Future: File upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user-avatar.jpg', file)
```

### 3. Built-in Authentication (Alternative)
```typescript
// Future: Use Supabase Auth instead of custom JWT
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

## 🔐 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different credentials for development/production
- Rotate secrets regularly

### 2. Database Security
- Use Row Level Security (RLS) in Supabase
- Implement proper user permissions
- Regular database backups

### 3. API Security
- Rate limiting (already implemented)
- Input validation (already implemented)
- CORS configuration (already implemented)

## 📊 Monitoring and Analytics

### Supabase Dashboard
- **Database Performance**: Query performance metrics
- **API Usage**: Track API calls and usage
- **Error Logs**: Monitor application errors
- **User Analytics**: Track user activity

### Custom Monitoring
```typescript
// Future: Custom analytics
const analytics = {
  trackUserRegistration: (userId: string) => {
    // Track user registration events
  },
  trackJobPosting: (jobId: string, userId: string) => {
    // Track job posting events
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check your internet connection
   - Verify the DATABASE_URL is correct
   - Ensure Supabase project is active

2. **Authentication Error**
   - Verify database password is correct
   - Check if project is paused (free tier limitation)

3. **Schema Push Failed**
   - Check Prisma schema syntax
   - Verify database permissions
   - Check Supabase project status

### Getting Help

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Discord Community**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: [github.com/supabase/supabase](https://github.com/supabase/supabase)

## 🎯 Next Steps

After successful Supabase setup:

1. **Test Database Connection**
   ```bash
   npm run db:studio
   ```

2. **Create Sample Data**
   ```bash
   # Register a test user via API
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Password123","firstName":"John","lastName":"Doe","userType":"CLIENT"}'
   ```

3. **Explore Supabase Dashboard**
   - Check your tables in the Table Editor
   - Run queries in the SQL Editor
   - Monitor logs in the Logs section

4. **Plan Future Features**
   - Real-time messaging
   - File uploads
   - Advanced authentication
   - Analytics dashboard

---

🎉 **Congratulations!** Your Brenda backend is now powered by Supabase!



