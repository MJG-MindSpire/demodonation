import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { PortalCredential } from './dist/models/PortalCredential.js';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await PortalCredential.findOne({ portalKey: 'admin', username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin credentials
    const passwordHash = await PortalCredential.hashPassword('admin123');
    const admin = new PortalCredential({
      portalKey: 'admin',
      username: 'admin',
      passwordHash,
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
