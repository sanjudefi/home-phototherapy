/**
 * Script to create a Super Admin user
 *
 * Usage: npx tsx scripts/create-admin.ts <email> <password> <name> <phone>
 * Example: npx tsx scripts/create-admin.ts admin@example.com MyPassword123 "John Doe" "9876543210"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error('❌ Missing arguments!');
    console.log('\nUsage: npx tsx scripts/create-admin.ts <email> <password> <name> <phone>');
    console.log('Example: npx tsx scripts/create-admin.ts admin@example.com MyPassword123 "John Doe" "9876543210"');
    process.exit(1);
  }

  const [email, password, name, phone] = args;

  // Validate inputs
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('❌ Invalid email address');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPER_ADMIN',
        name,
        phone,
        city: 'Mumbai', // Default city
        status: 'ACTIVE',
      },
    });

    console.log('✅ Super Admin created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🔗 Login URL: http://localhost:3000/admin/login');
    console.log('\n⚠️  Keep these credentials safe!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
