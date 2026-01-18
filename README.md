# Home Phototherapy Management System

A comprehensive web-based application to manage phototherapy equipment rental business operating through doctor referrals across multiple cities.

## Features

### Core Functionality
- **Multi-role Access Control**: Super Admin, Sub-Admin, and Doctor portals
- **Lead Management**: Track patient leads from submission to completion
- **Equipment Tracking**: Real-time equipment status and availability
- **Financial Management**: Automated commission calculations with flexible rates
- **Payout System**: Weekly payouts with receipt upload capability
- **Automated Notifications**: WhatsApp and SMS notifications for patients and doctors
- **Analytics Dashboard**: Real-time metrics and reporting across cities
- **Patient Forms**: Pre-acceptance form system with eligibility validation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **State Management**: React Hooks + Server Components
- **UI Components**: Custom components with Lucide icons
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd home-phototherapy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL and other configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/phototherapy_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Initialize the database:
```bash
npx prisma db push
```

5. (Optional) Seed the database with sample data:
```bash
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
home-phototherapy/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin portal
│   ├── doctor/            # Doctor portal
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client
│   ├── utils.ts          # Helper functions
│   └── auth.ts           # Auth configuration
├── prisma/               # Database schema
│   └── schema.prisma     # Prisma schema
├── public/               # Static files
└── types/                # TypeScript types
```

## Database Schema

The application uses the following main entities:

- **Users**: Authentication and role management
- **Doctors**: Doctor profiles with commission rates
- **Leads**: Patient leads and referrals
- **Equipment**: Phototherapy equipment inventory
- **Rentals**: Active and completed rentals
- **Financials**: Revenue, expenses, and commission tracking
- **Payouts**: Doctor payment records
- **Notifications**: Communication logs
- **Patient Forms**: Pre-acceptance form submissions

See `prisma/schema.prisma` for the complete database schema.

## User Roles

### Super Admin
- Full system access and oversight
- Manage all doctors, leads, equipment
- Process payouts and upload receipts
- View analytics across all cities
- Manage sub-admins

### Sub-Admin
- Update lead statuses
- Manage equipment assignments
- Input rental costs and expenses
- Limited financial access (configurable)

### Doctor
- Submit patient leads
- View lead status and progress
- Track earnings and payment history
- Update bank/payment details

## Key Workflows

### 1. Doctor Submits Lead
1. Doctor logs in and submits patient information
2. Admin receives notification
3. Lead appears in admin dashboard

### 2. Lead Processing
1. Admin sends pre-acceptance form to patient
2. Patient completes form
3. Admin validates eligibility
4. Equipment assigned and shipped
5. Rental period tracked automatically
6. Automated notifications sent to patient

### 3. Financial Calculation
1. Admin enters rental amount and expenses
2. System calculates:
   - Base Amount = Revenue - Expenses - GST
   - Doctor Commission = Base × Commission Rate
   - Net Profit = Base - Commission
3. Commission added to pending payouts

### 4. Payout Processing
1. Admin reviews pending payouts
2. Makes external payment
3. Uploads payment receipt
4. Doctor notified via WhatsApp

## API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/admin/doctors` - Doctor management
- `/api/admin/leads` - Lead management
- `/api/admin/equipment` - Equipment management
- `/api/admin/financials` - Financial operations
- `/api/admin/payouts` - Payout processing
- `/api/doctor/leads` - Doctor lead operations
- `/api/patient/form/:token` - Patient form access

## Development

### Running Database Migrations

```bash
npx prisma migrate dev
```

### Viewing Database

```bash
npm run db:studio
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The app is optimized for Vercel deployment with automatic Edge Functions and optimizations.

### Environment Variables for Production

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Production URL
- `NEXTAUTH_SECRET` - Secure random string
- `WHATSAPP_API_KEY` - WhatsApp Business API key (when configured)
- `SMS_API_KEY` - SMS gateway API key (when configured)

## Features Roadmap

### Phase 1 (Current - MVP)
- [x] Project setup and configuration
- [x] Database schema design
- [ ] Authentication system
- [ ] Admin dashboard
- [ ] Doctor portal
- [ ] Lead management
- [ ] Equipment tracking
- [ ] Financial management
- [ ] Basic notifications

### Phase 2 (Post-MVP)
- [ ] WhatsApp/SMS integration
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Patient portal
- [ ] Mobile app
- [ ] CRM integration

## Contributing

This is a private project. For any questions or issues, please contact the development team.

## License

Proprietary - All rights reserved

## Support

For support, email support@homephototherapy.com or contact the admin team.
