import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import EmergencyAlert from './models/EmergencyAlert.js';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const cleanupTestAlerts = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all emergency alerts with invalid or test data
    const testTitles = ['dd', 'cc', 'ny', 'hyh', 'hn', 'hii', 'rynniyn', 'vhvk', 'hhjgvj', 'l.'];
    
    // Delete by exact title match (test alerts)
    const result1 = await EmergencyAlert.deleteMany({
      title: { $in: testTitles }
    });
    console.log(`✅ Deleted ${result1.deletedCount} test alerts by title`);

    // Delete alerts with very short titles (likely test data)
    const result2 = await EmergencyAlert.deleteMany({
      $expr: { $lte: [{ $strLenCP: '$title' }, 3] }
    });
    console.log(`✅ Deleted ${result2.deletedCount} alerts with short titles`);

    // Delete alerts with very short messages (likely test data)
    const result3 = await EmergencyAlert.deleteMany({
      $expr: { $lte: [{ $strLenCP: '$message' }, 3] }
    });
    console.log(`✅ Deleted ${result3.deletedCount} alerts with short messages`);

    // List remaining active alerts
    const remaining = await EmergencyAlert.find({ status: 'active' })
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`\n📊 Remaining active alerts: ${remaining.length}`);
    remaining.forEach(alert => {
      console.log(`  - "${alert.title}" (${alert.severity}) by ${alert.issuedBy?.name || 'Unknown'}`);
    });

    console.log('\n✨ Cleanup complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanupTestAlerts();
