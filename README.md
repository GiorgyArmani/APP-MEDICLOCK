# Doctor Appointment Dashboard (MediClock)

A Next.js application for managing doctor shifts and appointments with role-based access control.

## Features

- **Role-Based Access**: Four doctor roles (Internacion, Consultorio, Completo, Administrator)
- **Shift Management**: Create, assign, accept or reject shifts
- **Free Shift Pool**: Unassigned shifts available to multiple roles
- **Real-time Updates**: Instant status updates and notifications
- **Secure Authentication**: Supabase Auth with Row Level Security
- **WhatsApp Ready**: Phone number support for future WhatsApp notifications

## Tech Stack

- **Frontend**: Next.js 16 with React Server Components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel (free tier)

## Setup

### 1. Database Setup

Create a new Supabase project at [supabase.com](https://supabase.com), then run the SQL scripts:

1. Go to your Supabase Dashboard → SQL Editor
2. Run `scripts/01-create-tables.sql` to create the database schema
3. (Optional) Run `scripts/02-seed-sample-data.sql` for test data

If you have an existing database, run `scripts/03-migration-remove-ghl.sql` to add the phone_number field.

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

Get your Supabase credentials from: Dashboard → Settings → API

### 3. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 4. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For Doctors

1. Sign up at `/signup` with your email and select your role
2. Log in at `/login`
3. View your assigned shifts in the dashboard
4. Accept or reject pending shifts
5. View free shifts available to your role

### For Administrators

1. Create new shifts via the admin dashboard
2. Assign shifts to specific doctors or to a role pool
3. Monitor shift status and doctor responses
4. Manage doctor accounts

## Doctor Roles

- **Internacion**: Hospital ward shifts only
- **Consultorio**: Clinic/office shifts only
- **Completo**: Can take all shift types
- **Administrator**: Full system access + shift management

## Shift Categories

The system supports various shift categories:
- `consultorio_a_8_14` - Clinic A, 8am-2pm
- `internacion_5000_8_14` - Ward 5000, 8am-2pm
- Custom categories can be added as needed

## Deployment to Vercel

### Quick Deploy

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and click "Import Project"

3. Select your GitHub repository

4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (use your Vercel domain)

5. Click "Deploy"

### Update Supabase Redirect URLs

After deployment, add your Vercel domain to Supabase:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL" and "Redirect URLs"

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Doctors can only view/update their own shifts
- ✅ Administrators have full visibility
- ✅ Server-side authentication checks
- ✅ Secure session management via Supabase

## Future Enhancements

- [ ] WhatsApp notifications for shift assignments
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Calendar integration
- [ ] Mobile app (React Native)
- [ ] Shift swap functionality
- [ ] Availability management UI

## Cost

**$0/month** - Completely free on:
- Vercel Free Tier (100GB bandwidth/month)
- Supabase Free Tier (500MB database, 50K monthly active users)

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT

