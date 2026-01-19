# Vercel Environment Variables Configuration

## Required Environment Variables for Production

Add these environment variables in your Vercel project settings:
(Go to: Project Settings → Environment Variables)

### 1. Database Connection
```
DATABASE_URL=postgres://7b3b4d0a5bc89ccf1aa48b9ab75cf31919546b023f54a433d725923cb6b37a69:sk_snVVdx6-0Lqc7rL9OCmig@db.prisma.io:5432/postgres?sslmode=require
```

### 2. NextAuth Configuration (CRITICAL - This fixes the login issue)
```
NEXTAUTH_URL=https://home-phototherapy.vercel.app
NEXTAUTH_SECRET=8Xk9mP2vN4qR7sT1wU6yB3gH5jL0nM8pQ2rS4tV7xZ9
```

**IMPORTANT:** The `NEXTAUTH_URL` must match your actual deployment URL.

### 3. App Configuration
```
NEXT_PUBLIC_APP_URL=https://home-phototherapy.vercel.app
```

### 4. Optional (for future features)
```
WHATSAPP_API_KEY=
WHATSAPP_API_URL=
SMS_API_KEY=
SMS_API_URL=
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

## How to Add Environment Variables in Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project: `home-phototherapy`
3. Go to **Settings** → **Environment Variables**
4. Add each variable above:
   - Name: `NEXTAUTH_URL`
   - Value: `https://home-phototherapy.vercel.app`
   - Environment: Select **Production**, **Preview**, and **Development**
5. Click **Save**
6. Repeat for `NEXTAUTH_SECRET`, `DATABASE_URL`, etc.

## After Adding Variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **Redeploy** (3-dot menu → Redeploy)
4. Wait for the deployment to complete

## Test Login:

After redeployment:
- Admin Login: https://home-phototherapy.vercel.app/admin/login
  - Email: admin@phototherapy.com
  - Password: Admin@123456

- Test Doctor Login: https://home-phototherapy.vercel.app/doctor/login
  - Email: doctor@test.com
  - Password: Doctor@123456

## Troubleshooting:

If login still fails:
1. Check browser console for errors (F12)
2. Verify all environment variables are set correctly
3. Ensure NEXTAUTH_URL exactly matches your deployment URL (with https://)
4. Clear browser cookies and try again
