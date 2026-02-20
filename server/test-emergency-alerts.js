/**
 * Test Script: Check Emergency Alerts in Database
 * 
 * This script helps debug the notification toggle feature by showing
 * all emergency alerts and their notificationsEnabled status.
 * 
 * Run with: node server/test-emergency-alerts.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmergencyAlert from './models/EmergencyAlert.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climate-disaster';

async function testEmergencyAlerts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    // Get all active alerts
    const activeAlerts = await EmergencyAlert.find({ status: 'active' })
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    console.log(`Found ${activeAlerts.length} active emergency alerts:\n`);

    if (activeAlerts.length === 0) {
      console.log('No active alerts found in database.');
      process.exit(0);
    }

    // Display each alert
    activeAlerts.forEach((alert, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Alert ${index + 1}:`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`ID:                    ${alert._id}`);
      console.log(`Title:                 ${alert.title}`);
      console.log(`Status:                ${alert.status}`);
      console.log(`Notifications Enabled: ${alert.notificationsEnabled}`);
      console.log(`  └─ Type:             ${typeof alert.notificationsEnabled}`);
      console.log(`  └─ Exists:           ${alert.notificationsEnabled !== undefined}`);
      console.log(`Severity:              ${alert.severity}`);
      console.log(`Action Required:       ${alert.actionRequired}`);
      console.log(`Issued By:             ${alert.issuedBy?.name || 'Unknown'}`);
      console.log(`Created:               ${alert.createdAt}`);
      console.log(`Updated:               ${alert.updatedAt}`);
      
      // Check if it should be visible on landing page
      const shouldShow = alert.status === 'active' && alert.notificationsEnabled !== false;
      console.log(`\n🔔 Should Show on Landing Page: ${shouldShow ? '✅ YES' : '❌ NO'}`);
      
      if (!shouldShow) {
        console.log(`   Reason: ${alert.status !== 'active' ? 'Status not active' : 'Notifications disabled'}`);
      }
    });

    console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('SUMMARY');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    const withNotificationsOn = activeAlerts.filter(a => a.notificationsEnabled !== false).length;
    const withNotificationsOff = activeAlerts.filter(a => a.notificationsEnabled === false).length;
    const withoutField = activeAlerts.filter(a => a.notificationsEnabled === undefined).length;
    
    console.log(`Total Active Alerts:              ${activeAlerts.length}`);
    console.log(`  └─ With Notifications ON:       ${withNotificationsOn}`);
    console.log(`  └─ With Notifications OFF:      ${withNotificationsOff}`);
    console.log(`  └─ Without notificationsEnabled: ${withoutField}`);
    console.log(`\nAlerts Visible on Landing Page:   ${withNotificationsOn}`);
    
    if (withoutField > 0) {
      console.log(`\n⚠️  WARNING: ${withoutField} alert(s) missing 'notificationsEnabled' field!`);
      console.log(`   Run migration: node server/migrate-emergency-alerts.js`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run test
testEmergencyAlerts();
