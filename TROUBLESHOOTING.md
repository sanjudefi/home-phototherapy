# Troubleshooting Guide

Common issues and solutions for the Home Phototherapy Management System.

## 🔴 ERR_TOO_MANY_REDIRECTS (FIXED)

**Issue**: Page shows "ERR_TOO_MANY_REDIRECTS" or "redirected you too many times"

**Status**: ✅ **FIXED** in latest commit (0c54e09)

### What Was Wrong

The issue was using NextAuth's `auth()` middleware wrapper, which conflicts with Vercel's Edge Runtime and causes infinite redirect loops on production deployments.

### What Was Fixed

**Commit 0c54e09** - Complete middleware rewrite:
1. **Removed NextAuth middleware wrapper** - No longer using `auth()` in middleware
2. **Simplified to basic middleware** - Just route filtering now
3. **Auth moved to pages** - Each page handles its own auth checks
4. **Size reduced** - Middleware went from 153 kB to 34 kB
5. **Better Vercel compatibility** - Works perfectly with Edge Runtime

### Verify The Fix

After the latest deployment completes:

1. **Clear your browser cache and cookies**
   - Chrome: Settings → Privacy → Clear browsing data
   - Or use Incognito/Private mode

2. **Visit your Vercel deployment URL**
   - Should load the homepage without redirects
   - Example: `https://home-phototherapy-git-claude-phototherapy-rental-system-lhkav-username.vercel.app`

3. **Test these pages**:
   - ✅ Homepage: Should load immediately
   - ✅ Admin Login: `/admin/login` - Should show login form
   - ✅ Doctor Login: `/doctor/login` - Should show login form
   - ✅ Doctor Register: `/doctor/register` - Should show registration form

### If Still Having Issues

**1. Clear Everything**
```bash
# Clear browser data
- Cookies
- Cached images
- Site data

# Or test in Incognito/Private window
```

**2. Wait for Deployment**
- Go to Vercel Dashboard → Deployments
- Wait for the latest deployment to show "Ready"
- Use the new deployment URL (changes with each deployment)

**3. Check Vercel Logs**
- Click on the deployment
- Go to "Functions" tab
- Look for error messages

---

## 🔧 Common Deployment Issues

### Build Fails in Vercel

**Symptoms**: Deployment fails during build step

**Check**:
1. Environment variables are set in Vercel dashboard
2. `DATABASE_URL` is correct
3. All dependencies are in `package.json`

**Solution**:
```bash
# Test locally first
npm run build

# If it works locally, check Vercel logs for specific error
```

### Database Connection Errors

**Symptoms**: "Can't reach database server" or similar errors

**Solutions**:

1. **Verify DATABASE_URL in Vercel**
   - Go to Settings → Environment Variables
   - Check `DATABASE_URL` is set correctly
   - Should match your Vercel Postgres connection string

2. **Check Vercel Postgres Status**
   - Go to Storage tab in Vercel
   - Verify database is active and accessible

3. **Test Connection**
   - Deploy a simple API route that tries to connect
   - Check function logs for detailed error

### Authentication Not Working

**Symptoms**: Can't login, or stuck on login page

**Solutions**:

1. **Verify Environment Variables**
   ```
   NEXTAUTH_URL = https://your-actual-vercel-url.vercel.app
   NEXTAUTH_SECRET = your-secret-here
   ```

2. **NEXTAUTH_URL Must Match Deployment URL**
   - For production: `https://your-project.vercel.app`
   - For preview: Use the preview URL or set a wildcard

3. **Check Database for Users**
   - Use Prisma Studio locally: `npm run db:studio`
   - Or check directly in Vercel Postgres
   - Ensure admin user exists

4. **Clear Cookies**
   - Old auth cookies can cause issues
   - Always clear cookies after changing auth config

### Pages Not Found (404)

**Symptoms**: Routes that should exist show 404

**Solutions**:

1. **Check Middleware Matcher**
   - Ensure middleware isn't blocking the route
   - Check `middleware.ts` config

2. **Verify File Structure**
   - Pages must be in correct app directory structure
   - Check file naming (page.tsx, layout.tsx, etc.)

3. **Check Build Output**
   - Look at Vercel build logs
   - Verify pages are being generated

---

## 🌐 Environment Variable Issues

### Setting Environment Variables in Vercel

**For Production**:
1. Go to Project → Settings → Environment Variables
2. Add variable name and value
3. Select "Production" environment
4. Save
5. **Redeploy** for changes to take effect

**For Preview (Branch Deployments)**:
1. Same as above
2. Select "Preview" environment
3. This applies to all preview deployments

**Common Variables Needed**:
```
DATABASE_URL=postgres://...
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=random-secret-here
```

### Generate NEXTAUTH_SECRET

```bash
# On Mac/Linux
openssl rand -base64 32

# Or online
# Visit: https://generate-secret.vercel.app
```

---

## 🔍 Debugging Tips

### Check Function Logs

1. Go to Vercel Dashboard
2. Click on your deployment
3. Click "Functions" tab
4. Look for errors in real-time logs

### Check Build Logs

1. Click on deployment
2. View "Building" section
3. Expand logs to see detailed output
4. Look for TypeScript errors, missing dependencies, etc.

### Test Locally First

Always test changes locally before deploying:

```bash
# Install dependencies
npm install

# Run build
npm run build

# If build succeeds, test the app
npm run dev

# Then push to trigger deployment
git push
```

### Use Preview Deployments

Don't deploy directly to production:

1. Create feature branch
2. Push to GitHub
3. Test on preview URL
4. Merge to main only when confirmed working

---

## 📊 Performance Issues

### Slow Page Loads

**Check**:
1. Database query performance
2. Number of API calls per page
3. Image sizes and optimization
4. Bundle size

**Solutions**:
1. Add database indexes
2. Implement caching
3. Use Next.js Image component
4. Code splitting

### Function Timeouts

**Symptoms**: 504 Gateway Timeout errors

**Solutions**:
1. Optimize database queries
2. Add pagination for large datasets
3. Use serverless function timeout settings
4. Consider background jobs for long operations

---

## 🔐 Security Issues

### Exposed Secrets

**If you accidentally commit secrets**:

1. **Rotate immediately**
   - Generate new `NEXTAUTH_SECRET`
   - Update in Vercel dashboard
   - Redeploy

2. **Remove from git history**
   ```bash
   # Use git filter-branch or BFG Repo Cleaner
   # Contact support if uncertain
   ```

### CORS Errors

**If accessing from different domain**:

1. Add CORS headers in `next.config.ts`
2. Or use Next.js API routes as proxy
3. Verify `NEXTAUTH_URL` matches origin

---

## 🆘 Getting Help

### Check These First

1. **Vercel Status**: https://vercel-status.com
2. **Next.js Docs**: https://nextjs.org/docs
3. **Prisma Docs**: https://www.prisma.io/docs
4. **NextAuth Docs**: https://next-auth.js.org

### Provide This Info When Reporting Issues

1. **Error message** (exact text or screenshot)
2. **When it happens** (always, specific action, etc.)
3. **Environment** (local, preview, production)
4. **Steps to reproduce**
5. **Build/function logs** from Vercel
6. **Browser console errors** (F12 → Console tab)

### Quick Diagnostics

```bash
# Check Node version
node --version  # Should be 18+

# Check dependencies
npm list

# Test build
npm run build

# Check database connection
npx prisma db pull

# View Prisma Client
npx prisma studio
```

---

## ✅ Health Check Checklist

Use this to verify everything is working:

- [ ] Homepage loads without errors or redirects
- [ ] Admin login page is accessible
- [ ] Doctor login page is accessible
- [ ] Doctor registration works
- [ ] Can login as admin
- [ ] Admin dashboard loads and shows data
- [ ] Can login as doctor
- [ ] Doctor dashboard loads and shows data
- [ ] Database connection is stable
- [ ] No errors in function logs
- [ ] No errors in browser console
- [ ] Build completes successfully
- [ ] Environment variables are set correctly

---

## 📝 Known Issues

### Current Known Issues

None at the moment! 🎉

### Recently Fixed

- ✅ **ERR_TOO_MANY_REDIRECTS** - FINAL FIX in commit 0c54e09 (removed NextAuth middleware wrapper)
- ✅ **Build TypeScript errors** - Fixed in commit 8928851
- ✅ **NextAuth/Vercel Edge Runtime conflict** - Fixed in commit 0c54e09

---

## 🔄 Rollback Procedure

If a deployment breaks something:

### Via Vercel Dashboard

1. Go to Deployments
2. Find last working deployment
3. Click "•••" menu
4. Click "Promote to Production"

### Via Git

```bash
# Revert last commit
git revert HEAD
git push

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force
```

**⚠️ Warning**: Force push rewrites history - use with caution!

---

**Last Updated**: January 2026
**Current Version**: Working and stable ✅
