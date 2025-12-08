ra# Deployment Guide - Vercel + Supabase

This guide will help you deploy MediClock to Vercel with Supabase as your database.

## Prerequisites

- GitHub account
- Vercel account (free)
- Supabase account (free)

## Step 1: Set Up Supabase

### 1.1 Create a New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: mediclock (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `scripts/01-create-tables.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

### 1.3 (Optional) Add Sample Data

1. In SQL Editor, create another new query
2. Copy contents of `scripts/02-seed-sample-data.sql`
3. Paste and run
4. This creates test doctors and shifts

### 1.4 Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")

### 1.5 Configure Authentication

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3000/dashboard
   ```
   (We'll add your Vercel URL here later)

## Step 2: Prepare Your Code

### 2.1 Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - MediClock"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/mediclock.git
git branch -M main
git push -u origin main
```

### 2.2 Create .env.local (for local testing)

Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

Replace with your actual Supabase credentials from Step 1.4.

**Important**: `.env.local` is in `.gitignore` - it won't be pushed to GitHub.

## Step 3: Deploy to Vercel

### 3.1 Import Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 3.2 Configure Environment Variables

Before deploying, add your environment variables:

1. In the "Configure Project" section, expand **Environment Variables**
2. Add these three variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` | `https://your-app.vercel.app/dashboard` |

   **Note**: For the redirect URL, you can use your Vercel domain. If you don't know it yet, use a placeholder and update it after deployment.

### 3.3 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like `https://mediclock-xxxxx.vercel.app`

## Step 4: Update Supabase Redirect URLs

Now that you have your Vercel URL:

1. Go back to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/dashboard
   ```
3. Also update **Site URL** to:
   ```
   https://your-app.vercel.app
   ```

## Step 5: Update Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`
3. Update it to your actual Vercel URL:
   ```
   https://your-app.vercel.app/dashboard
   ```
4. Click "Save"
5. Go to **Deployments** tab
6. Click "..." on the latest deployment → "Redeploy"

## Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Click "Sign Up"
3. Create a test doctor account
4. Check your email for confirmation
5. Log in and test the dashboard

## Troubleshooting

### "Invalid login credentials"
- Make sure you confirmed your email
- Check that redirect URLs are correct in Supabase

### "Failed to fetch"
- Verify environment variables in Vercel
- Check that Supabase project is running (not paused)

### Build fails on Vercel
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Try building locally: `npm run build`

### Database errors
- Verify SQL scripts ran successfully
- Check Supabase logs: Dashboard → Logs

## Custom Domain (Optional)

### Add Your Own Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Add your domain (e.g., `mediclock.com`)
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs to use your custom domain

## Continuous Deployment

Now that everything is set up:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel automatically deploys your changes!

## Monitoring

### Vercel Analytics (Free)

1. In Vercel Dashboard → Your Project → **Analytics**
2. View page views, performance metrics, etc.

### Supabase Logs

1. In Supabase Dashboard → **Logs**
2. View database queries, errors, etc.

## Scaling

Both Vercel and Supabase free tiers are generous:

| Service | Free Tier Limits |
|---------|------------------|
| **Vercel** | 100GB bandwidth/month, Unlimited deployments |
| **Supabase** | 500MB database, 1GB file storage, 50K MAU |

If you outgrow free tiers:
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month

## Security Checklist

- ✅ Environment variables set correctly
- ✅ RLS policies enabled (done in SQL scripts)
- ✅ HTTPS enabled (automatic on Vercel)
- ✅ Redirect URLs configured
- ✅ Strong database password
- ✅ `.env.local` in `.gitignore`

## Next Steps

- Set up email notifications
- Add WhatsApp integration
- Configure custom domain
- Set up monitoring/alerts
- Add more administrators

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check Supabase logs
3. Review this guide
4. Open an issue on GitHub
