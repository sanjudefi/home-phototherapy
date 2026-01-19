import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Super Admin
  const adminPassword = 'Admin@123456'; // Change this password!
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@phototherapy.com' },
    update: {},
    create: {
      email: 'admin@phototherapy.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      name: 'System Administrator',
      phone: '9999999999',
      city: 'Mumbai',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Super Admin created:', adminUser.email);

  // Create a sample doctor for testing
  const doctorPassword = 'Doctor@123456'; // Change this password!
  const hashedDoctorPassword = await bcrypt.hash(doctorPassword, 10);

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@test.com' },
    update: {},
    create: {
      email: 'doctor@test.com',
      passwordHash: hashedDoctorPassword,
      role: 'DOCTOR',
      name: 'Dr. Test Doctor',
      phone: '9876543210',
      city: 'Mumbai',
      status: 'ACTIVE',
    },
  });

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: 'Pediatrics',
      commissionRate: 15, // 15% commission
      status: 'ACTIVE',
    },
  });

  console.log('✅ Test Doctor created:', doctorUser.email);

  // Create sample equipment
  const equipment1 = await prisma.equipment.create({
    data: {
      name: 'Phototherapy Unit #001',
      modelNumber: 'PT-2024-001',
      serialNumber: 'SN001234567',
      equipmentType: 'RETURNABLE',
      status: 'AVAILABLE',
      currentLocationCity: 'Mumbai',
    },
  });

  const equipment2 = await prisma.equipment.create({
    data: {
      name: 'Phototherapy Unit #002',
      modelNumber: 'PT-2024-001',
      serialNumber: 'SN001234568',
      equipmentType: 'RETURNABLE',
      status: 'AVAILABLE',
      currentLocationCity: 'Delhi',
    },
  });

  console.log('✅ Sample equipment created');

  // Create settings
  const settings = await prisma.setting.upsert({
    where: { settingKey: 'notification_templates' },
    update: {},
    create: {
      settingKey: 'notification_templates',
      settingValue: {
        payment_confirmation: 'Thank you for your payment. Your phototherapy equipment will be shipped shortly.',
        equipment_shipped: 'Your phototherapy equipment has been shipped. Expected delivery: {deliveryDate}',
        therapy_started: 'Your phototherapy session has started. Timer is now running. Session will end at {endTime}.',
        one_hour_warning: 'Your phototherapy session will end in 1 hour. Please prepare to return the equipment or contact us for extension.',
        therapy_completed: 'Thank you for using our phototherapy service! We hope it was helpful. Please share your feedback.',
        extension_started: 'Your phototherapy session has been extended. New end time: {endTime}',
      },
      updatedBy: adminUser.id,
    },
  });

  console.log('✅ Notification templates created');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('📧 Admin Login Credentials:');
  console.log('   Email: admin@phototherapy.com');
  console.log('   Password: Admin@123456');
  console.log('\n📧 Test Doctor Login Credentials:');
  console.log('   Email: doctor@test.com');
  console.log('   Password: Doctor@123456');
  console.log('\n⚠️  IMPORTANT: Change these passwords after first login!\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
