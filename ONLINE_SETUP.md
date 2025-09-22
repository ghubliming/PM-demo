# PM Demo - Online Database Setup Guide

This guide will help you convert the PM Demo from local storage to an online database using Supabase.

## 🚀 Quick Setup (5 minutes)

### Option 1: Use the App as-is (Local Storage Mode)
The app works out-of-the-box without any setup! It will automatically use localStorage for data persistence and show "💾 Local Storage" in the header.

### Option 2: Enable Online Database (Supabase)

#### Step 1: Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

#### Step 2: Set Up the Database Schema
1. In your Supabase dashboard, go to the SQL Editor
2. Copy and paste the contents of `/database/schema.sql` 
3. Run the SQL to create all the necessary tables and indexes

#### Step 3: Configure Environment Variables
1. Copy `.env.example` to `.env.local` in the frontend directory:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   You can find these values in your Supabase project settings:
   - Go to Settings > API
   - Copy the "Project URL" and "anon/public" key

#### Step 4: Deploy and Test
1. Build and run the application:
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. You should now see "🌐 Online Database" in the header
3. All user data, markets, and bets will be stored in your Supabase database

## 🔧 Development Mode

For local development with online database:
```bash
cd frontend
npm run dev
```

## 📊 Database Features

When using Supabase, you get:

- **Real-time data persistence** across all users
- **Scalable PostgreSQL database** that can handle many concurrent users
- **Data backup and recovery** through Supabase
- **User authentication** ready for future expansion
- **Automatic data synchronization** between different browser sessions

## 🔄 Migration from Local to Online

The app seamlessly handles both modes:

- **Without Supabase**: Uses localStorage, works offline, data persists per browser
- **With Supabase**: Uses online database, data shared across all users and devices
- **Fallback mechanism**: If Supabase is configured but fails, automatically falls back to localStorage

## 📱 Deployment

### GitHub Pages (Current)
The app is already set up to deploy to GitHub Pages automatically. Simply push to the main branch.

### Vercel (Recommended for Supabase)
1. Connect your GitHub repo to Vercel
2. Add your environment variables in the Vercel dashboard
3. Deploy automatically on each push

### Other Platforms
The app works on any static hosting platform that supports Next.js:
- Netlify
- AWS S3 + CloudFront
- Firebase Hosting
- Any other static hosting provider

## 🛡️ Security

- Row Level Security (RLS) is enabled by default
- Currently allows all operations for demo purposes
- For production, customize the RLS policies in Supabase
- Environment variables keep your database credentials secure

## 📈 Monitoring

In your Supabase dashboard, you can:
- View all stored data in real-time
- Monitor database performance
- Set up alerts and notifications
- Export data for backup

## 🔍 Troubleshooting

### App shows "💾 Local Storage" instead of "🌐 Online Database"
- Check that your `.env.local` file exists and has the correct values
- Verify your Supabase URL and key are correct
- Make sure you're not using placeholder values

### Database errors in console
- Ensure you ran the schema.sql file in Supabase
- Check that your database is running
- Verify your environment variables are correct

### Build failures
- Make sure all dependencies are installed: `npm install`
- Check that your environment file is named `.env.local` (not `.env`)
- Ensure your Supabase credentials don't contain special characters that need escaping

## 🎯 Next Steps

Once you have the online database working:

1. **Customize the database schema** to add new features
2. **Set up proper authentication** using Supabase Auth
3. **Add real-time subscriptions** for live updates
4. **Implement user roles and permissions**
5. **Add data analytics and reporting**

## 💡 Cost Considerations

- **Supabase free tier** includes:
  - Up to 50,000 monthly active users
  - 500MB database storage
  - 1GB bandwidth
  - 2 million realtime messages

This is more than enough for a demo or small production app!

## 🤝 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase dashboard for database connectivity
3. Test with localStorage mode first to isolate issues
4. Review the environment variable configuration

The app is designed to be robust and will automatically fall back to localStorage if there are any database issues.