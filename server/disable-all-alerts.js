/**
 * Quick Fix: Disable ALL Active Emergency Alert Notifications
 * 
 * This script sets notificationsEnabled = false for ALL active alerts.
 * Use this to immediately stop all emergency notifications from showing.
 * 
 * Run with: node server/disable-all-alerts.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import EmergencyAlert from './models/EmergencyAlert.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climate-disaster';

async function disableAllAlerts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    // Find all active alerts
    const activeAlerts = await EmergencyAlert.find({ status: 'active' });

    if (activeAlerts.length === 0) {
      console.log('✓ No active alerts found. Nothing to disable.');
      process.exit(0);
    }

    console.log(`Found ${activeAlerts.length} active alert(s):\n`);

    // Update each alert
    let disabledCount = 0;
    for (const alert of activeAlerts) {
      console.log(`Alert: "${alert.title}"`);
      console.log(`  Current notificationsEnabled: ${alert.notificationsEnabled}`);
      
      if (alert.notificationsEnabled === false) {
        console.log(`  ⊗ Already disabled, skipping...\n`);
        continue;
      }
      
      alert.notificationsEnabled = false;
      alert.updatedAt = new Date();
      await alert.save();
      
      console.log(`  ✓ Disabled notifications\n`);
      disabledCount++;
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✓ Successfully disabled ${disabledCount} alert(s)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\nAll emergency alerts are now hidden from the landing page.`);
    console.log(`Refresh the website to see the changes.`);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run script
disableAllAlerts();
