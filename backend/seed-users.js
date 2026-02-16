import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './dist/models/User.js';

const testUsers = [
  {
    email: 'donor@test.com',
    password: 'donor123',
    role: 'donor',
    name: 'Test Donor',
    isActive: true
  },
  {
    email: 'field@test.com',
    password: 'field123',
    role: 'field',
    name: 'Test Field Worker',
    fatherName: 'Test Father',
    cnic: '12345-1234567-1',
    address: '123 Test Street, Test City',
    phone: '0300-1234567',
    isActive: true,
    registrationStatus: 'approved'
  },
  {
    email: 'receiver@test.com',
    password: 'receiver123',
    role: 'receiver',
    name: 'Test Receiver',
    fatherName: 'Test Father',
    cnic: '12345-1234567-2',
    address: '456 Test Street, Test City',
    phone: '0300-7654321',
    isActive: true,
    registrationStatus: 'approved'
  }
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    for (const userData of testUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const passwordHash = await User.hashPassword(userData.password);
      const user = new User({
        ...userData,
        passwordHash
      });

      await user.save();
      console.log(`Created ${userData.role} user: ${userData.email} / ${userData.password}`);
    }

    console.log('\nAll test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('- Donor:    donor@test.com / donor123');
    console.log('- Field:    field@test.com / field123');
    console.log('- Receiver: receiver@test.com / receiver123');
    console.log('- Admin:    admin / admin123 (use portal login)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
