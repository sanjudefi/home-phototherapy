# Seed Production Database - Quick Guide

## Problem
You're getting "Invalid email or password" because the production database doesn't have any users yet.

## Solution - Seed the Database

### Option 1: From Your Local Machine (Recommended)

1. **Make sure you have the production DATABASE_URL in your .env file:**
```bash
DATABASE_URL="postgres://7b3b4d0a5bc89ccf1aa48b9ab75cf31919546b023f54a433d725923cb6b37a69:sk_snVVdx6-0Lqc7rL9OCmig@db.prisma.io:5432/postgres?sslmode=require"
```

2. **Run the production seed script:**
```bash
npm run db:seed-production
```

3. **You should see:**
```
🌱 Seeding production database...
✅ Created admin user: admin@phototherapy.com
✅ Created test doctor: doctor@test.com
✨ Seeding completed!

Default Login Credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin Login:
  Email: admin@phototherapy.com
  Password: Admin@123456

Doctor Login:
  Email: doctor@test.com
  Password: Doctor@123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

4. **Now try logging in:**
   - Admin: https://home-phototherapy.vercel.app/admin/login
   - Doctor: https://home-phototherapy.vercel.app/doctor/login

### Option 2: From Vercel CLI

If you have Vercel CLI installed:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Pull environment variables
vercel env pull

# Seed the database
npm run db:seed-production
```

## What This Script Does

The seed script creates:
1. ✅ **Admin User**
   - Email: `admin@phototherapy.com`
   - Password: `Admin@123456`
   - Role: SUPER_ADMIN

2. ✅ **Test Doctor**
   - Email: `doctor@test.com`
   - Password: `Doctor@123456`
   - Role: DOCTOR
   - Commission Rate: 15%

## Troubleshooting

### Error: "User already exists"
✅ This is good! It means the database was already seeded. Just try logging in.

### Error: "Can't reach database server"
❌ Check your DATABASE_URL is correct in .env file

### Error: "Invalid \`prisma.user.create()\`"
❌ Run `npx prisma db push` first to create the tables

## Verify Database

To check if users exist in the database:

```bash
# Open Prisma Studio
npm run db:studio

# Then check the "User" table
```

## After Seeding

1. ✅ Login to admin panel: https://home-phototherapy.vercel.app/admin/login
2. ✅ Use credentials above
3. ✅ Change admin password from the profile settings
4. ✅ Create additional doctors as needed
