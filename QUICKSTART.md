# Quick Start Guide

Get your Home Phototherapy Management System up and running in 5 minutes!

## 🚀 Fast Setup (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Setup database (creates tables + seed data)
npm run db:setup

# 3. Start development server
npm run dev
```

That's it! Open http://localhost:3000

## 📧 Default Login Credentials

### Admin Portal
- URL: http://localhost:3000/admin/login
- Email: `admin@phototherapy.com`
- Password: `Admin@123456`

### Doctor Portal
- URL: http://localhost:3000/doctor/login
- Email: `doctor@test.com`
- Password: `Doctor@123456`

⚠️ **Change these passwords after first login!**

## ✅ What You Get Out of the Box

After running `npm run db:setup`, your database will have:

- ✅ Super Admin account ready to use
- ✅ Test Doctor account with 15% commission rate
- ✅ 2 sample phototherapy equipment units
- ✅ Notification message templates configured
- ✅ All database tables created

## 🎯 Quick Actions After Setup

### 1. Login as Admin
```
Go to: http://localhost:3000/admin/login
Email: admin@phototherapy.com
Password: Admin@123456
```

### 2. Login as Doctor
```
Go to: http://localhost:3000/doctor/login
Email: doctor@test.com
Password: Doctor@123456
```

### 3. View Database
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

## 🔧 Troubleshooting

### Database Connection Error?

Your `.env` file should have this:
```env
DATABASE_URL="postgres://7b3b4d0a5bc89ccf1aa48b9ab75cf31919546b023f54a433d725923cb6b37a69:sk_snVVdx6-0Lqc7rL9OCmig@db.prisma.io:5432/postgres?sslmode=require"
```

### Seed Script Fails?

Try step by step:
```bash
# Create tables first
npm run db:push

# Then seed data
npm run db:seed
```

### Need to Create Admin Manually?

```bash
npx tsx scripts/create-admin.ts your@email.com YourPassword123 "Your Name" "9876543210"
```

## 📱 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:setup` | Create database + seed data |
| `npm run db:push` | Create/update database tables |
| `npm run db:seed` | Add initial data |
| `npm run db:studio` | Open database viewer |

## 🌐 Environment Variables

Your `.env` file is already configured with:

```env
DATABASE_URL=...           # ✅ Vercel Postgres URL
NEXTAUTH_URL=...          # ✅ App URL
NEXTAUTH_SECRET=...       # ✅ Auth secret
```

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 Next Steps

1. **Explore the Admin Portal**
   - View dashboard statistics
   - Check equipment inventory
   - Review notification templates

2. **Test Doctor Portal**
   - View earnings dashboard
   - Check commission rate
   - Prepare to submit leads

3. **Read Full Documentation**
   - [README.md](./README.md) - Project overview
   - [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Detailed database guide
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to Vercel

4. **Start Development**
   - Continue building lead management
   - Add equipment tracking features
   - Implement financial calculations

## 🆘 Need Help?

- **Database issues**: Check [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Features**: Read [README.md](./README.md)

## ⚡ Pro Tips

1. **Use Prisma Studio** to quickly view/edit data:
   ```bash
   npm run db:studio
   ```

2. **Reset database** if you need a fresh start:
   ```bash
   npx prisma migrate reset
   ```

3. **Check logs** if something doesn't work - most errors show in terminal

4. **Test with sample data** - Use the test doctor account to submit leads

## 🎉 You're Ready!

Your phototherapy management system is set up and ready to use. Start by logging into the admin portal and exploring the dashboard.

Happy coding! 🚀

---

**Questions?** Check the detailed guides or contact support.
