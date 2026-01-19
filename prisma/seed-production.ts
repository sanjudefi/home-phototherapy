// Script to seed production database with default users
// Run this with: npx tsx prisma/seed-production.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@phototherapy.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@phototherapy.com',
        name: 'Super Admin',
        phone: '9999999999',
        passwordHash: adminPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Created admin user:', admin.email);
  }

  // Check if test doctor already exists
  const existingDoctor = await prisma.user.findUnique({
    where: { email: 'doctor@test.com' },
  });

  if (existingDoctor) {
    console.log('✅ Test doctor already exists');
  } else {
    // Create test doctor
    const doctorPassword = await bcrypt.hash('Doctor@123456', 10);
    const doctorUser = await prisma.user.create({
      data: {
        email: 'doctor@test.com',
        name: 'Dr. Test Kumar',
        phone: '9876543210',
        passwordHash: doctorPassword,
        role: 'DOCTOR',
        status: 'ACTIVE',
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        clinicName: 'Test Pediatric Clinic',
        phone: '9876543210',
        city: 'Mumbai',
        commissionRate: 15,
      },
    });
    console.log('✅ Created test doctor:', doctorUser.email);
  }

  console.log('✨ Seeding completed!');
  console.log('\nDefault Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin Login:');
  console.log('  Email: admin@phototherapy.com');
  console.log('  Password: Admin@123456');
  console.log('\nDoctor Login:');
  console.log('  Email: doctor@test.com');
  console.log('  Password: Doctor@123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
