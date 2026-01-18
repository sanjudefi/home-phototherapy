# Deployment Guide for Vercel

This guide will help you deploy the Home Phototherapy Management System to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (recommended: Vercel Postgres, Neon, or Supabase)
3. GitHub account (for connecting your repository)

## Step 1: Prepare Your Database

### Option A: Vercel Postgres (Recommended for Vercel deployment)

1. Go to your Vercel dashboard
2. Navigate to Storage
3. Create a new Postgres database
4. Copy the connection string (it will look like: `postgres://...`)

### Option B: External PostgreSQL (Neon, Supabase, etc.)

1. Create a PostgreSQL database on your preferred provider
2. Copy the connection string

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Phototherapy Management System"

# Add remote repository
git remote add origin https://github.com/your-username/home-phototherapy.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy to Vercel

### Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

4. Add Environment Variables:

Required variables:
```
DATABASE_URL=your_postgres_connection_string
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate_a_random_secret_key
```

To generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

5. Click "Deploy"

### Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts to configure your deployment
```

## Step 4: Set Up the Database

After deployment, you need to initialize your database schema:

1. Install Vercel CLI if you haven't:
```bash
npm install -g vercel
```

2. Link your project:
```bash
vercel link
```

3. Pull environment variables:
```bash
vercel env pull
```

4. Run database migrations:
```bash
npx prisma db push
```

Alternatively, you can use Prisma Studio to manage your database:
```bash
npx prisma studio
```

## Step 5: Create Initial Admin User

You'll need to create an initial admin user manually. You can do this via Prisma Studio or by running a script:

### Option A: Via Prisma Studio

1. Run `npx prisma studio`
2. Open the Users table
3. Create a new user with:
   - email: your admin email
   - passwordHash: (hash generated using bcrypt - see below)
   - role: SUPER_ADMIN
   - name: Your name
   - phone: Your phone
   - status: ACTIVE

To generate a password hash:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

### Option B: Via SQL

Connect to your database and run:
```sql
-- First, generate a password hash using bcrypt
-- Then insert the user:
INSERT INTO users (id, email, password_hash, role, name, phone, status, created_at, updated_at)
VALUES (
  'cuid_here',
  'admin@example.com',
  '$2a$10$your_hashed_password_here',
  'SUPER_ADMIN',
  'Admin Name',
  '1234567890',
  'ACTIVE',
  NOW(),
  NOW()
);
```

## Step 6: Configure Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS settings as instructed
5. Update NEXTAUTH_URL environment variable to your custom domain

## Step 7: Set Up WhatsApp/SMS Integration (When Ready)

1. Sign up for WhatsApp Business API
2. Get your API credentials
3. Add to Vercel environment variables:
   - `WHATSAPP_API_KEY`
   - `WHATSAPP_API_URL`
   - `SMS_API_KEY`
   - `SMS_API_URL`
4. Redeploy the application

## Environment Variables Reference

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your deployment URL
- `NEXTAUTH_SECRET` - Random secret for JWT signing

### Optional (for notifications)
- `WHATSAPP_API_KEY` - WhatsApp Business API key
- `WHATSAPP_API_URL` - WhatsApp API endpoint
- `SMS_API_KEY` - SMS gateway API key
- `SMS_API_URL` - SMS gateway endpoint

## Troubleshooting

### Build Fails

1. Check that all environment variables are set
2. Verify DATABASE_URL is correct and accessible from Vercel
3. Check build logs in Vercel dashboard

### Database Connection Issues

1. Ensure your database allows connections from Vercel IPs
2. Verify the connection string is correct
3. For Vercel Postgres, ensure you're using the correct format

### Authentication Not Working

1. Verify NEXTAUTH_SECRET is set
2. Check NEXTAUTH_URL matches your deployment URL
3. Clear cookies and try again

## Post-Deployment Checklist

- [ ] Database is accessible
- [ ] Admin user created successfully
- [ ] Can login to admin portal
- [ ] Can login to doctor portal (after creating a test doctor)
- [ ] Environment variables are set correctly
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate is active
- [ ] WhatsApp/SMS integration configured (if ready)

## Monitoring and Maintenance

### View Logs
```bash
vercel logs
```

### Redeploy
```bash
vercel --prod
```

### Update Environment Variables
1. Go to Vercel dashboard
2. Navigate to Settings > Environment Variables
3. Update values
4. Redeploy for changes to take effect

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
- Contact support at support@homephototherapy.com

## Security Notes

1. **Never commit .env file** - It's in .gitignore by default
2. **Use strong passwords** - For admin accounts
3. **Rotate secrets regularly** - Especially NEXTAUTH_SECRET
4. **Enable 2FA** - On your Vercel account
5. **Monitor access logs** - Check for suspicious activity
6. **Keep dependencies updated** - Run `npm audit` regularly

## Performance Optimization

1. Enable caching in Vercel settings
2. Use Vercel Analytics to monitor performance
3. Optimize images using Next.js Image component
4. Enable database connection pooling

---

**Last Updated**: January 2026
**Version**: 1.0
