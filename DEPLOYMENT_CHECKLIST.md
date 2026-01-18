# Vercel Deployment Checklist

Use this checklist to ensure your Vercel deployment is properly configured.

## 📋 Pre-Deployment Checklist

### 1. Build Verification (Local)
- [ ] Run `npm install` successfully
- [ ] Run `npm run build` successfully (no errors)
- [ ] Test locally with `npm run dev`
- [ ] Can login to admin portal (http://localhost:3000/admin/login)
- [ ] Can login to doctor portal (http://localhost:3000/doctor/login)

### 2. Environment Variables (Vercel Dashboard)
- [ ] `DATABASE_URL` is set (Vercel Postgres connection string)
- [ ] `NEXTAUTH_URL` is set (production: `https://your-project.vercel.app`)
- [ ] `NEXTAUTH_SECRET` is set (generated with `openssl rand -base64 32`)
- [ ] All variables are set for **Production** environment
- [ ] (Optional) Variables set for **Preview** environment
- [ ] (Optional) Variables set for **Development** environment

### 3. Vercel Project Settings
- [ ] Project is linked to GitHub repository
- [ ] Framework is detected as **Next.js**
- [ ] Build command is set to: `prisma generate && next build`
- [ ] Output directory is: `.next`
- [ ] Install command is: `npm install`
- [ ] Node.js version: 18.x or higher

### 4. Git Configuration (Vercel)
- [ ] Production branch is set (usually `main` or `master`)
- [ ] Preview deployments enabled for **All branches**
- [ ] Auto-deploy enabled (Automatically deploy all commits)
- [ ] GitHub integration is connected and authorized

### 5. Database Setup
- [ ] Vercel Postgres database created
- [ ] Connection string copied to `DATABASE_URL`
- [ ] Database schema pushed: `npm run db:push` (or will run on first deploy)
- [ ] Seed data added: `npm run db:seed` (or manually via Prisma Studio)

## 🚀 Deployment Process

### First Deployment
1. [ ] Push code to GitHub
   ```bash
   git push origin your-branch-name
   ```

2. [ ] Check Vercel dashboard for deployment
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to **Deployments** tab
   - Watch build progress

3. [ ] Wait for deployment to complete
   - Status should show: ✅ Ready
   - Click on deployment to get URL

4. [ ] Test the deployment
   - [ ] Visit deployment URL
   - [ ] Homepage loads correctly
   - [ ] Admin login page works
   - [ ] Doctor login page works

### Testing Automatic Deployments
1. [ ] Create a test branch
   ```bash
   git checkout -b test-auto-deploy
   ```

2. [ ] Make a small change
   ```bash
   echo "# Test" >> test.txt
   git add test.txt
   git commit -m "Test: Auto-deployment"
   git push origin test-auto-deploy
   ```

3. [ ] Verify in Vercel:
   - [ ] New deployment appears automatically
   - [ ] Preview URL is generated
   - [ ] Build completes successfully
   - [ ] Can access preview URL

## ✅ Post-Deployment Verification

### Check Deployment Status
- [ ] Deployment shows **Ready** status (green checkmark)
- [ ] No build errors in logs
- [ ] No runtime errors in function logs

### Test Application Functionality
- [ ] Homepage loads: `https://your-project.vercel.app`
- [ ] Admin login loads: `https://your-project.vercel.app/admin/login`
- [ ] Doctor login loads: `https://your-project.vercel.app/doctor/login`
- [ ] Doctor registration works: `https://your-project.vercel.app/doctor/register`

### Test Authentication
- [ ] Can create a test admin account (via Prisma Studio or seed script)
- [ ] Can login as admin with test credentials
- [ ] Redirects to admin dashboard after login
- [ ] Admin dashboard displays correctly
- [ ] Can logout successfully

### Test Database Connection
- [ ] Application can connect to database
- [ ] Can query data (dashboards load stats)
- [ ] No database connection errors in logs
- [ ] Prisma Client is generated correctly

### Test Doctor Portal
- [ ] Can register as a new doctor
- [ ] Receives confirmation/success message
- [ ] Can login with doctor credentials
- [ ] Doctor dashboard loads correctly
- [ ] Commission rate displays

## 🔍 Troubleshooting

### If Build Fails
1. [ ] Check build logs in Vercel dashboard
2. [ ] Look for specific error messages
3. [ ] Verify environment variables are set
4. [ ] Test build locally: `npm run build`
5. [ ] Check Node.js version compatibility

### If Deployment Succeeds but App Doesn't Work
1. [ ] Check function logs (Runtime errors)
2. [ ] Verify `NEXTAUTH_URL` matches deployment URL
3. [ ] Verify `DATABASE_URL` is accessible from Vercel
4. [ ] Check browser console for errors
5. [ ] Verify all environment variables are set

### If Database Connection Fails
1. [ ] Verify `DATABASE_URL` is correct
2. [ ] Check Vercel Postgres status
3. [ ] Ensure database allows connections
4. [ ] Run `npx prisma generate` locally and push again
5. [ ] Check if `prisma generate` runs in build logs

### If Authentication Doesn't Work
1. [ ] Verify `NEXTAUTH_SECRET` is set
2. [ ] Verify `NEXTAUTH_URL` matches deployment URL
3. [ ] Check that admin user exists in database
4. [ ] Clear cookies and try again
5. [ ] Check function logs for auth errors

## 📊 Monitoring

### Ongoing Checks (Weekly)
- [ ] Check deployment success rate
- [ ] Review error logs
- [ ] Monitor database usage
- [ ] Check function execution times
- [ ] Review bandwidth usage

### Performance Monitoring
- [ ] Set up Vercel Analytics (Settings → Analytics)
- [ ] Monitor page load times
- [ ] Check API response times
- [ ] Review error rates

### Security Checks (Monthly)
- [ ] Rotate `NEXTAUTH_SECRET`
- [ ] Review environment variables
- [ ] Check for outdated dependencies: `npm outdated`
- [ ] Update dependencies: `npm update`
- [ ] Review access logs

## 🎯 Production Readiness

Before promoting to production:

- [ ] All tests pass locally
- [ ] Build succeeds on preview deployment
- [ ] All features work on preview URL
- [ ] Database is properly seeded (or empty as needed)
- [ ] Admin account is created and tested
- [ ] Doctor registration flow works
- [ ] Environment variables are production-ready
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Domain is configured (if using custom domain)
- [ ] SSL certificate is active
- [ ] Backup strategy in place for database

## 📱 Custom Domain (Optional)

If using a custom domain:

- [ ] Domain added in Vercel settings
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] `NEXTAUTH_URL` updated to custom domain
- [ ] Test with custom domain URL
- [ ] Previous deployment URLs still work (optional)

## 🔄 Workflow Status

### Development → Preview → Production

1. **Development Phase**
   - [ ] Local development working
   - [ ] Feature branch created
   - [ ] Changes committed

2. **Preview Phase**
   - [ ] Pushed to GitHub
   - [ ] Preview deployment created
   - [ ] Tested on preview URL
   - [ ] Team reviewed changes

3. **Production Phase**
   - [ ] PR created and reviewed
   - [ ] Merged to main branch
   - [ ] Production deployment automatic
   - [ ] Tested on production URL
   - [ ] Monitoring active

## ✨ Success Criteria

Your deployment is successful when:

- ✅ Any branch push triggers automatic deployment
- ✅ Preview URLs are generated for each branch
- ✅ Build completes without errors
- ✅ Application loads correctly
- ✅ Authentication works
- ✅ Database connection is stable
- ✅ Can promote preview to production
- ✅ Production deploys automatically on main branch merge

## 📝 Notes

**Deployment URLs:**
- Preview: `https://home-phototherapy-git-[branch]-[username].vercel.app`
- Production: `https://home-phototherapy-[username].vercel.app`

**Default Credentials (After Seeding):**
- Admin: `admin@phototherapy.com` / `Admin@123456`
- Doctor: `doctor@test.com` / `Doctor@123456`

**Important Commands:**
```bash
# Test build locally
npm run build

# Deploy from CLI
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# Check status
vercel ls
```

---

**Status**: [ ] Setup Complete
**Date**: _______________
**Verified By**: _______________

---

**Next Steps After Successful Deployment:**
1. Continue building features (lead management, equipment tracking, etc.)
2. Set up monitoring and alerts
3. Configure automated backups
4. Plan for scaling as usage grows

**Need Help?** See [VERCEL_AUTO_DEPLOY.md](./VERCEL_AUTO_DEPLOY.md) for detailed troubleshooting.
