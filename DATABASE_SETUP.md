# Database Setup Guide

This guide will help you set up your Vercel Postgres database for the Home Phototherapy Management System.

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Vercel Postgres database credentials (you already have these!)

## Step 1: Install Dependencies

Make sure you've installed all dependencies including the new `tsx` package for running the seed script:

```bash
npm install
```

## Step 2: Configure Environment Variables

Your `.env` file has already been updated with your Vercel Postgres credentials. Verify it contains:

```env
DATABASE_URL="postgres://7b3b4d0a5bc89ccf1aa48b9ab75cf31919546b023f54a433d725923cb6b37a69:sk_snVVdx6-0Lqc7rL9OCmig@db.prisma.io:5432/postgres?sslmode=require"
```

## Step 3: Initialize the Database

Run this command to create all tables and seed initial data:

```bash
npm run db:setup
```

This will:
1. Push the Prisma schema to your database (creating all tables)
2. Run the seed script to create:
   - A Super Admin account
   - A test Doctor account
   - Sample equipment
   - Notification templates

### Or do it step by step:

```bash
# Step 1: Create database schema
npm run db:push

# Step 2: Seed initial data
npm run db:seed
```

## Step 4: Default Login Credentials

After seeding, you'll have these accounts:

### Super Admin Account
- **Email**: `admin@phototherapy.com`
- **Password**: `Admin@123456`
- **Login URL**: http://localhost:3000/admin/login

### Test Doctor Account
- **Email**: `doctor@test.com`
- **Password**: `Doctor@123456`
- **Login URL**: http://localhost:3000/doctor/login

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

## Step 5: Verify Database Setup

You can view and manage your database using Prisma Studio:

```bash
npm run db:studio
```

This will open a web interface at http://localhost:5555 where you can:
- View all tables and data
- Add/edit/delete records
- Verify the seed data was created correctly

## Troubleshooting

### Connection Issues

If you get a connection error:

1. **Check your database URL** - Make sure it's correct in `.env`
2. **Network access** - Ensure your IP is allowed (Vercel Postgres should allow all by default)
3. **SSL mode** - The connection string includes `sslmode=require` which is correct

### Seed Script Fails

If the seed script fails:

1. **Drop and recreate** - Sometimes it helps to start fresh:
```bash
# This will reset your database (WARNING: deletes all data)
npx prisma migrate reset
```

2. **Run seed manually**:
```bash
npx tsx prisma/seed.ts
```

### Can't Access from Local Machine

If you're having trouble connecting from your local machine:

1. **Use Vercel CLI** to run commands in Vercel's environment:
```bash
# Install Vercel CLI
npm install -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run the setup command in Vercel's environment
vercel exec npm run db:setup
```

## What Gets Created

### Database Tables

The seed script creates these tables:
- `users` - User accounts (admin, doctors)
- `doctors` - Doctor profiles
- `leads` - Patient leads
- `equipment` - Phototherapy equipment
- `rentals` - Rental tracking
- `financials` - Revenue and commissions
- `payouts` - Doctor payments
- `notifications` - Message logs
- `patient_forms` - Pre-acceptance forms
- `settings` - System configuration
- `audit_logs` - Activity tracking
- Plus several junction/history tables

### Sample Data

The seed creates:
- 1 Super Admin user
- 1 Test Doctor user with 15% commission rate
- 2 Sample phototherapy units
- Default notification message templates

## Next Steps

After database setup:

1. **Test the login**
   - Try logging in as admin
   - Try logging in as doctor
   - Verify dashboards load correctly

2. **Change passwords**
   - Update admin password
   - Update test doctor password
   - Or create new users and delete test accounts

3. **Start development**
   - Submit a test lead from doctor portal
   - Manage leads from admin portal
   - Test the equipment tracking

4. **Deploy to Vercel**
   - See DEPLOYMENT.md for full deployment guide

## Database Management Commands

```bash
# View database in browser
npm run db:studio

# Push schema changes
npm run db:push

# Re-seed database (adds data, doesn't delete existing)
npm run db:seed

# Complete setup (push + seed)
npm run db:setup

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client (happens automatically on install)
npx prisma generate
```

## Production Considerations

When deploying to production:

1. **Change all default passwords** immediately
2. **Set strong NEXTAUTH_SECRET** in Vercel environment variables
3. **Enable database backups** (Vercel Postgres has automatic backups)
4. **Monitor database usage** in Vercel dashboard
5. **Set up proper error logging**

## Environment Variables for Vercel

When deploying, add these to Vercel:

```
DATABASE_URL=postgres://...
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret
```

Generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Support

If you encounter issues:
1. Check Vercel Postgres dashboard for connection status
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check application logs
4. Contact support at support@homephototherapy.com

---

**Last Updated**: January 2026
