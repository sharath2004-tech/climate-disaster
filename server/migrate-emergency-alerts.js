/**
 * Migration Script: Add notificationsEnabled field to existing EmergencyAlerts
 * 
 * This script updates all EmergencyAlert documents that don't have the
 * notificationsEnabled field set, defaulting it to true.
 * 
 * Run with: node server/migrate-emergency-alerts.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import EmergencyAlert from './models/EmergencyAlert.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climate-disaster';

async function migrateEmergencyAlerts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    // Find all alerts without notificationsEnabled field or where it's undefined
    const alertsToUpdate = await EmergencyAlert.find({
      $or: [
        { notificationsEnabled: { $exists: false } },
        { notificationsEnabled: null }
      ]
    });

    console.log(`Found ${alertsToUpdate.length} emergency alerts to migrate\n`);

    if (alertsToUpdate.length === 0) {
      console.log('✓ No migration needed. All alerts have notificationsEnabled field.');
      process.exit(0);
    }

    // Update each alert
    for (const alert of alertsToUpdate) {
      console.log(`Migrating alert: ${alert.title} (ID: ${alert._id})`);
      console.log(`  Status: ${alert.status}`);
      console.log(`  Created: ${alert.createdAt}`);
      
      alert.notificationsEnabled = true; // Default to true for existing alerts
      await alert.save();
      
      console.log(`  ✓ Updated with notificationsEnabled: true\n`);
    }

    console.log(`\n✓ Migration completed successfully!`);
    console.log(`  Total alerts migrated: ${alertsToUpdate.length}`);
    console.log(`  All alerts now have notificationsEnabled field set to true`);

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateEmergencyAlerts();
