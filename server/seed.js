import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Alert from './models/Alert.js';
import CommunityPost from './models/CommunityPost.js';
import EvacuationRoute from './models/EvacuationRoute.js';
import Report from './models/Report.js';
import Resource from './models/Resource.js';
import User from './models/User.js';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Alert.deleteMany({});
    await Resource.deleteMany({});
    await Report.deleteMany({});
    await EvacuationRoute.deleteMany({});
    await CommunityPost.deleteMany({});
    // Don't delete users, only add test users if they don't exist
    console.log('Cleared existing data');

    // Create a test user for reports and community posts
    // Valid roles: 'user', 'admin', 'subadmin', 'responder'
    let testUser = await User.findOne({ email: 'testuser@disaster.app' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test Citizen',
        email: 'testuser@disaster.app',
        password: 'password123', // Will be hashed by model pre-save hook
        phone: '+91 98765 43210',
        role: 'user',
        location: {
          type: 'Point',
          coordinates: [72.8347, 19.0760],
          address: 'Mumbai, Maharashtra'
        }
      });
      console.log('Created test user');
    }

    // Create admin user
    let adminUser = await User.findOne({ email: 'admin@skynetra.app' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'SKYNETRA Admin',
        email: 'admin@skynetra.app',
        password: 'admin123', // Will be hashed by model pre-save hook
        phone: '+91 90000 00001',
        role: 'admin',
        isActive: true,
        location: {
          type: 'Point',
          coordinates: [72.8777, 19.0760],
          address: 'Mumbai Command Center'
        }
      });
      console.log('Created admin user: admin@skynetra.app / admin123');
    }

    // Create another volunteer user
    let volunteerUser = await User.findOne({ email: 'volunteer@disaster.app' });
    if (!volunteerUser) {
      volunteerUser = await User.create({
        name: 'Dr. Rahul Sharma',
        email: 'volunteer@disaster.app',
        password: 'password123', // Will be hashed by model pre-save hook
        phone: '+91 98765 11111',
        role: 'responder',
        location: {
          type: 'Point',
          coordinates: [72.8478, 19.0968],
          address: 'Mumbai, Maharashtra'
        }
      });
      console.log('Created volunteer user');
    }

    // Seed Alerts
    const alerts = await Alert.insertMany([
      {
        type: 'flood',
        severity: 'critical',
        title: 'Flash Flood Warning',
        description: 'Flash flooding expected in low-lying areas. Move to higher ground immediately.',
        location: {
          address: 'Andheri West, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8347, 19.1365]
        },
        status: 'active',
        sourceAgency: 'IMD',
        affectedRadius: 5,
        instructions: ['Move to higher ground', 'Avoid low-lying areas', 'Do not attempt to cross flooded roads']
      },
      {
        type: 'hurricane',
        severity: 'high',
        title: 'Cyclone Alert - Category 2',
        description: 'Cyclone approaching coastal areas. Expected landfall in 24 hours.',
        location: {
          address: 'Coastal Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8777, 19.0760]
        },
        status: 'active',
        sourceAgency: 'IMD',
        affectedRadius: 50,
        instructions: ['Stock up on essentials', 'Secure loose objects', 'Stay indoors during storm']
      },
      {
        type: 'other',
        severity: 'medium',
        title: 'Heat Wave Advisory',
        description: 'Temperature expected to exceed 42°C. Stay hydrated and avoid outdoor activities.',
        location: {
          address: 'Central Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8777, 19.0760]
        },
        status: 'active',
        sourceAgency: 'IMD',
        affectedRadius: 20,
        instructions: ['Stay hydrated', 'Avoid direct sunlight', 'Wear light clothing']
      },
      {
        type: 'landslide',
        severity: 'high',
        title: 'Landslide Risk Alert',
        description: 'Heavy rainfall has increased landslide risk in hilly areas.',
        location: {
          address: 'Malabar Hill, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.7947, 18.9550]
        },
        status: 'active',
        sourceAgency: 'NDMA',
        affectedRadius: 3,
        instructions: ['Evacuate if in vulnerable area', 'Watch for signs of ground movement']
      }
    ]);
    console.log(`Seeded ${alerts.length} alerts`);

    // Seed Resources (Shelters, Hospitals, Water stations, etc.)
    const resources = await Resource.insertMany([
      {
        name: 'Bandra Community Center',
        type: 'shelter',
        location: {
          address: 'Hill Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8347, 19.0544]
        },
        contact: { phone: '+91 22 2645 5000', email: 'bandra.shelter@mumbai.gov.in' },
        availability: 'available',
        capacity: { current: 266, maximum: 500 },
        facilities: ['Water', 'Food', 'Medical', 'Power Backup']
      },
      {
        name: 'Lilavati Hospital',
        type: 'hospital',
        location: {
          address: 'A-791, Bandra Reclamation',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8266, 19.0509]
        },
        contact: { phone: '+91 22 2645 5000', email: 'info@lilavatihospital.com' },
        availability: 'available',
        capacity: { current: 255, maximum: 300 }
      },
      {
        name: 'Municipal Water Station - Bandra',
        type: 'water-supply',
        location: {
          address: 'Near Bandra Station',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8400, 19.0544]
        },
        contact: { phone: '+91 22 2400 0000' },
        availability: 'available',
        capacity: { current: 2000, maximum: 10000 }
      },
      {
        name: 'NGO Community Kitchen',
        type: 'food-bank',
        location: {
          address: 'Khar Danda Road, Khar West',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8327, 19.0700]
        },
        contact: { phone: '+91 98765 43210' },
        availability: 'available',
        capacity: { current: 150, maximum: 500 }
      },
      {
        name: 'Emergency Power Hub - Santacruz',
        type: 'other',
        location: {
          address: 'SV Road, Santacruz West',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8400, 19.0820]
        },
        contact: { phone: '+91 22 2612 3456' },
        availability: 'available',
        capacity: { current: 50, maximum: 200 }
      },
      {
        name: 'Andheri Stadium Emergency Shelter',
        type: 'shelter',
        location: {
          address: 'Andheri Sports Complex, Andheri East',
          city: 'Mumbai',
          state: 'Maharashtra',
          coordinates: [72.8697, 19.1197]
        },
        contact: { phone: '+91 22 2345 6789' },
        availability: 'available',
        capacity: { current: 310, maximum: 1200 },
        facilities: ['Water', 'Food', 'Medical', 'Power Backup', 'Sanitation']
      }
    ]);
    console.log(`Seeded ${resources.length} resources`);

    // Seed Reports (require userId and valid type enum)
    // Valid types: 'hazard', 'incident', 'resource-need', 'infrastructure-damage', 'other'
    const reports = await Report.insertMany([
      {
        userId: testUser._id,
        type: 'hazard',
        title: 'Road Flooded on Link Road',
        description: 'Water level rising rapidly. Road is impassable for vehicles.',
        severity: 'high',
        status: 'verified',
        verified: true,
        location: {
          type: 'Point',
          coordinates: [72.8347, 19.1365],
          address: 'Link Road, Andheri West, Mumbai'
        }
      },
      {
        userId: testUser._id,
        type: 'infrastructure-damage',
        title: 'Tree Fallen on SV Road',
        description: 'Large tree has fallen blocking the main road. Traffic diverted.',
        severity: 'medium',
        status: 'pending',
        location: {
          type: 'Point',
          coordinates: [72.8400, 19.0820],
          address: 'SV Road, Santacruz, Mumbai'
        }
      },
      {
        userId: testUser._id,
        type: 'incident',
        title: 'Power Cut in Khar Area',
        description: 'Entire locality without power for 3 hours. No ETA for restoration.',
        severity: 'medium',
        status: 'verified',
        verified: true,
        location: {
          type: 'Point',
          coordinates: [72.8327, 19.0700],
          address: 'Khar West, Mumbai'
        }
      }
    ]);
    console.log(`Seeded ${reports.length} reports`);

    // Seed Community Posts (require userId)
    // Valid categories: 'update', 'help-needed', 'help-offered', 'information', 'question', 'alert'
    const communityPosts = await CommunityPost.insertMany([
      {
        userId: testUser._id,
        category: 'help-needed',
        title: 'Need drinking water supplies',
        content: 'Family of 5 in need of drinking water. Our area has been without water for 2 days.',
        location: {
          type: 'Point',
          coordinates: [72.8697, 19.1197],
          address: 'Andheri East, Mumbai'
        },
        status: 'active',
        tags: ['water', 'urgent', 'family']
      },
      {
        userId: testUser._id,
        category: 'help-needed',
        title: 'Medical supplies for elderly',
        content: 'Need insulin and blood pressure medication for my elderly parents.',
        location: {
          type: 'Point',
          coordinates: [72.8347, 19.0544],
          address: 'Bandra West, Mumbai'
        },
        status: 'active',
        tags: ['medical', 'urgent', 'elderly']
      },
      {
        userId: volunteerUser._id,
        category: 'help-offered',
        title: 'Offering transport help',
        content: 'I have a 4x4 vehicle and can help transport people or supplies in flooded areas.',
        location: {
          type: 'Point',
          coordinates: [72.8266, 19.1044],
          address: 'Juhu, Mumbai'
        },
        status: 'active',
        tags: ['transport', 'vehicle', 'flood']
      },
      {
        userId: volunteerUser._id,
        category: 'help-offered',
        title: 'First Aid trained volunteer',
        content: 'Medical professional offering first aid assistance. Available 24/7.',
        location: {
          type: 'Point',
          coordinates: [72.8478, 19.0968],
          address: 'Vile Parle, Mumbai'
        },
        status: 'active',
        tags: ['medical', 'first-aid', 'volunteer']
      },
      {
        userId: testUser._id,
        category: 'help-needed',
        title: 'Temporary shelter needed for family',
        content: 'House flooded, family of 4 including 2 children need temporary shelter.',
        location: {
          type: 'Point',
          coordinates: [72.8327, 19.0700],
          address: 'Khar West, Mumbai'
        },
        status: 'active',
        tags: ['shelter', 'urgent', 'family', 'children']
      }
    ]);
    console.log(`Seeded ${communityPosts.length} community posts`);

    // Seed Evacuation Routes
    // Uses: fromLocation, toLocation (not startPoint, endPoint)
    // Status: 'open', 'congested', 'closed', 'hazardous'
    const evacuationRoutes = await EvacuationRoute.insertMany([
      {
        name: 'Andheri to Bandra Shelter Route',
        description: 'Safe route from Andheri flood zone to Bandra Community Center',
        fromLocation: {
          type: 'Point',
          coordinates: [72.8347, 19.1365],
          address: 'Andheri West, Mumbai'
        },
        toLocation: {
          type: 'Point',
          coordinates: [72.8347, 19.0544],
          address: 'Bandra Community Center, Mumbai'
        },
        distance: 8.5,
        estimatedDuration: 25,
        status: 'open',
        transportModes: ['driving', 'walking'],
        instructions: ['Follow Western Express Highway', 'Take Bandra exit', 'Follow signs to Community Center']
      },
      {
        name: 'Santacruz to Andheri Stadium Route',
        description: 'Alternative route to Andheri Stadium shelter',
        fromLocation: {
          type: 'Point',
          coordinates: [72.8400, 19.0820],
          address: 'Santacruz West, Mumbai'
        },
        toLocation: {
          type: 'Point',
          coordinates: [72.8697, 19.1197],
          address: 'Andheri Stadium, Mumbai'
        },
        distance: 4.2,
        estimatedDuration: 15,
        status: 'open',
        transportModes: ['driving', 'walking'],
        instructions: ['Take SV Road north', 'Turn right at Andheri signal', 'Stadium is 500m ahead']
      }
    ]);
    console.log(`Seeded ${evacuationRoutes.length} evacuation routes`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
