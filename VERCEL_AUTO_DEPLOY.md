# Vercel Deployment & Auto-Deploy Setup Guide

This guide will help you configure automatic deployments in Vercel for any branch you push to.

## ✅ Prerequisites Checklist

- [x] Project linked to Vercel
- [x] GitHub repository connected
- [x] Vercel Postgres database created
- [ ] Environment variables configured
- [ ] Auto-deploy settings enabled

## 🚀 Step-by-Step Setup

### Step 1: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: `home-phototherapy`
3. Click on **Settings** tab
4. Click on **Environment Variables** in the sidebar

Add these environment variables:

#### Production Environment
```
DATABASE_URL=postgres://7b3b4d0a5bc89ccf1aa48b9ab75cf31919546b023f54a433d725923cb6b37a69:sk_snVVdx6-0Lqc7rL9OCmig@db.prisma.io:5432/postgres?sslmode=require

NEXTAUTH_URL=https://your-project.vercel.app

NEXTAUTH_SECRET=8Xk9mP2vN4qR7sT1wU6yB3gH5jL0nM8pQ2rS4tV7xZ9
```

**IMPORTANT**: For production, generate a new `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

#### Preview Environment (Optional)
You can add the same variables for Preview deployments to test branches before production.

#### Development Environment (Optional)
For local development simulation on Vercel.

**How to Add:**
1. Click "Add New"
2. Enter variable name (e.g., `DATABASE_URL`)
3. Enter value
4. Select environments: Production, Preview, Development (check all)
5. Click "Save"

Repeat for all three variables.

### Step 2: Enable Automatic Deployments for All Branches

1. In your project settings, go to **Git** section
2. Find **Deploy Hooks** and **Branch Protection**

**Configure Branch Deployments:**

Option A: Via Vercel Dashboard
1. Go to **Settings** → **Git**
2. Under **Production Branch**, ensure your main branch is set
3. Under **Preview Deployments**, select: **All branches**
4. This ensures ANY branch you push will create a deployment

Option B: Via Project Settings
1. Click **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Ensure these are set:
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

### Step 3: GitHub Integration Settings

1. Go to **Settings** → **Git**
2. Verify **GitHub Integration** is connected
3. Ensure these settings are enabled:
   - ✅ Automatically deploy all commits
   - ✅ Deploy preview for all branches
   - ✅ Cancel previous deployments (recommended)

### Step 4: Test Automatic Deployment

Let's test if everything works:

```bash
# Create a test branch
git checkout -b test-deployment

# Make a small change
echo "# Test deployment" >> test.md

# Commit and push
git add test.md
git commit -m "Test: Verify automatic deployment"
git push origin test-deployment
```

**What Should Happen:**
1. Vercel receives the push notification from GitHub
2. A new preview deployment starts automatically
3. You'll see the deployment in your Vercel dashboard
4. You'll get a unique URL like: `home-phototherapy-git-test-deployment-yourname.vercel.app`

### Step 5: Monitor Deployment Status

**In Vercel Dashboard:**
1. Go to **Deployments** tab
2. You should see:
   - Latest deployment from your branch
   - Build logs
   - Deployment status (Building → Success/Failed)
   - Preview URL

**Via GitHub:**
1. Go to your GitHub repository
2. Click on the commit
3. You should see Vercel checks:
   - ✅ Vercel deployment preview ready
   - Link to preview deployment

### Step 6: Configure Deploy Notifications (Optional)

Get notified when deployments complete:

1. Go to **Settings** → **Notifications**
2. Add notification channels:
   - Email
   - Slack
   - Discord
   - Webhook

## 🔧 Troubleshooting

### Deployments Not Triggering

**Problem:** Push to branch but no deployment starts

**Solutions:**

1. **Check GitHub Integration**
   - Settings → Git → Verify connected
   - Try disconnecting and reconnecting GitHub

2. **Check Repository Permissions**
   - Vercel needs access to your repository
   - Go to GitHub → Settings → Applications → Vercel
   - Ensure repository access is granted

3. **Verify Branch Settings**
   - Settings → Git → Deploy Hooks
   - Ensure "All branches" is selected for previews

4. **Force Reconnection**
   ```bash
   # In your project directory
   vercel link
   # Follow prompts to relink
   ```

### Build Failures

**Problem:** Deployment starts but build fails

**Check Build Logs:**
1. Click on the failed deployment
2. View build logs
3. Common issues:

**Missing Environment Variables**
- Verify all env vars are set in Vercel
- Check spelling matches exactly

**TypeScript Errors**
- Test build locally: `npm run build`
- Fix any type errors
- Commit and push again

**Database Connection**
- Ensure `DATABASE_URL` is correct
- Prisma generate should run automatically

**Memory Issues**
- Go to Settings → General → Memory Allocation
- Increase if needed (default: 1024 MB)

### Deployment Succeeds but App Doesn't Work

**Check Runtime Logs:**
1. Go to your deployment
2. Click **Functions** tab
3. View runtime errors

**Common Issues:**

1. **Database not accessible**
   - Verify DATABASE_URL in production
   - Check Vercel Postgres connection

2. **Authentication errors**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set

3. **Environment variable mismatch**
   - Production URL vs local development
   - Update NEXTAUTH_URL to actual domain

## 📦 Promoting Preview to Production

When you're happy with a preview deployment:

**Method 1: Via Dashboard**
1. Go to **Deployments**
2. Find your preview deployment
3. Click **•••** (three dots)
4. Click **Promote to Production**

**Method 2: Via Git**
```bash
# Merge your branch to main (or your production branch)
git checkout main
git merge your-feature-branch
git push origin main
```

The main branch will automatically deploy to production.

## 🎯 Recommended Workflow

1. **Develop locally**
   - Make changes
   - Test locally: `npm run dev`

2. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add feature"
   git push origin feature/my-feature
   ```

4. **Automatic preview deployment**
   - Vercel automatically deploys
   - Test on preview URL
   - Share with team for review

5. **Merge to production**
   - Create PR on GitHub
   - Review and approve
   - Merge to main
   - Automatic production deployment

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` to git (already in `.gitignore`)
   - Use different secrets for production vs preview
   - Rotate `NEXTAUTH_SECRET` periodically

2. **Database Access**
   - Use read-only credentials for preview branches (optional)
   - Full access only for production

3. **Branch Protection**
   - Enable branch protection on main in GitHub
   - Require reviews before merging
   - Prevent direct pushes to main

## 📊 Monitoring Deployments

**Vercel Analytics** (Free)
- Go to **Analytics** tab
- View:
  - Page views
  - Response times
  - Error rates

**Build Time Tracking**
- Go to **Deployments**
- Compare build times
- Optimize if builds are slow

**Function Logs**
- Real-time logs during deployment
- Runtime logs after deployment
- Debug API issues

## 🚀 Advanced: Deploy Hooks

Create webhooks to trigger deployments:

1. Go to **Settings** → **Git**
2. Scroll to **Deploy Hooks**
3. Click **Create Hook**
4. Name it (e.g., "Manual Deploy")
5. Select branch
6. Get webhook URL

Use it:
```bash
curl -X POST https://api.vercel.com/v1/integrations/deploy/...
```

## 📝 Quick Reference

| Action | Command/Location |
|--------|-----------------|
| View deployments | Dashboard → Deployments |
| Check build logs | Click deployment → View logs |
| Add env variables | Settings → Environment Variables |
| Configure Git | Settings → Git |
| Promote to prod | Deployment → ••• → Promote |
| View runtime logs | Deployment → Functions |
| Check analytics | Analytics tab |

## ✅ Checklist: Is Everything Working?

- [ ] Pushing to any branch triggers deployment
- [ ] Preview URL is generated for each branch
- [ ] Build completes successfully
- [ ] Environment variables are set
- [ ] Database connection works
- [ ] Authentication works on preview
- [ ] Can promote preview to production
- [ ] Production deployment automatic on main merge
- [ ] Notifications working (if configured)

## 🆘 Still Having Issues?

1. **Check Vercel Status**: https://vercel-status.com
2. **Review Vercel Docs**: https://vercel.com/docs
3. **GitHub Issues**: Check for similar problems
4. **Vercel Support**: Contact via dashboard

## 📞 Support Resources

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- GitHub Integration: https://vercel.com/docs/git
- Environment Variables: https://vercel.com/docs/environment-variables

---

**Last Updated**: January 2026

Your project is now configured for automatic deployments on every push! 🎉
