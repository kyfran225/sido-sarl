/* ============================
   SCRIPT DE SEED (DEV / TEST)
============================ */
// - Protections pour éviter exécution en production
// - Support MONGO_URI || MONGODB_URI
// - Option SKIP_SEED_CLEANUP=true pour préserver les données
// - SALT_ROUNDS configurable via env
// - Fermeture propre de la connexion mongoose

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// ============================
// Guard: protection environnement
// ============================
if (process.env.NODE_ENV === 'production') {
  console.error(
    'Refus d’exécuter le seed en production. Définissez NODE_ENV=development pour seed.'
  );
  process.exit(1);
}

// ============================
// Config connexion / options
// ============================
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sido-sarl';
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // si besoin, ajouter poolSize, serverSelectionTimeoutMS, etc.
};

// ============================
// Import des modèles (ESM .js)
// ============================
import User from '../src/models/user.model.js';
import Station from '../src/models/station.model.js';
import Client from '../src/models/client.model.js';
import Rule from '../src/models/rule.model.js';
import Transaction from '../src/models/transaction.model.js';
import Points from '../src/models/points.model.js';
import Bon from '../src/models/bon.model.js';

// ============================
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

// ============================
// Seed principal
// ============================
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`🔌 Connecting to MongoDB at ${mongoUri}`);
    await mongoose.connect(mongoUri, mongooseOptions);
    console.log('📦 Connected to MongoDB');

    const skipCleanup = String(process.env.SKIP_SEED_CLEANUP || 'false').toLowerCase() === 'true';

    // Clear existing data (optionnel — controllable via SKIP_SEED_CLEANUP)
    if (!skipCleanup) {
      console.log('🧹 Clearing existing data (dev only)...');
      await Promise.all([
        User.deleteMany({}),
        Station.deleteMany({}),
        Client.deleteMany({}),
        Rule.deleteMany({}),
        Transaction.deleteMany({}),
        Points.deleteMany({}),
        Bon.deleteMany({})
      ]);
    } else {
      console.log('ℹ️ SKIP_SEED_CLEANUP=true — nettoyage des collections SKIPPÉ.');
    }

    // 1. Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@sido-sarl.com',
      passwordHash: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('✅ Admin user created:', admin.email);

    // 2. Create station ST-001
    console.log('🏪 Creating station ST-001...');
    const station = new Station({
      name: 'Station Dakar Centre',
      code: 'ST-001',
      address: '123 Avenue Léopold Sédar Senghor, Dakar'
    });
    await station.save();
    console.log('✅ Station created:', station.code);

    // 3. Create pompiste user for the station
    console.log('👨‍💼 Creating pompiste user...');
    const pompistePassword = await bcrypt.hash('pompiste123', SALT_ROUNDS);
    const pompiste = new User({
      name: 'Ahmed Diop',
      email: 'ahmed.diop@sido-sarl.com',
      passwordHash: pompistePassword,
      role: 'pompiste',
      stationId: station._id
    });
    await pompiste.save();
    console.log('✅ Pompiste user created:', pompiste.email);

    // 4. Create manager user for the station
    console.log('👔 Creating manager user...');
    const managerPassword = await bcrypt.hash('manager123', SALT_ROUNDS);
    const manager = new User({
      name: 'Fatou Sow',
      email: 'fatou.sow@sido-sarl.com',
      passwordHash: managerPassword,
      role: 'manager',
      stationId: station._id
    });
    await manager.save();
    console.log('✅ Manager user created:', manager.email);

    // 5. Create bonus rule
    console.log('📋 Creating bonus rule...');
    const rule = new Rule({
      name: 'Standard Loyalty Program',
      version: '1.0.0',
      effectiveFrom: new Date('2024-01-01'),
      segment: 'default',
      pointsPerTransaction: 1,
      thresholdToBonus: [
        { threshold: 10000, rewardType: 'amount', rewardValue: 500, expiryDays: 30 },
        { threshold: 25000, rewardType: 'amount', rewardValue: 1500, expiryDays: 30 },
        { threshold: 50000, rewardType: 'amount', rewardValue: 3000, expiryDays: 30 }
      ]
    });
    await rule.save();
    console.log('✅ Bonus rule created:', rule.name);

    // 6. Create sample clients
    console.log('👥 Creating sample clients...');
    const clientsData = [
      { sid: 'SID001', firstName: 'Mamadou', lastName: 'Diallo', phone: '+221771234567' },
      { sid: 'SID002', firstName: 'Amina', lastName: 'Faye', phone: '+221772345678' },
      { sid: 'SID003', firstName: 'Ibrahima', lastName: 'Ndiaye', phone: '+221773456789' },
      { sid: 'SID004', firstName: 'Khadija', lastName: 'Ba', phone: '+221774567890' },
      { sid: 'SID005', firstName: 'Ousmane', lastName: 'Sy', phone: '+221775678901' }
    ];

    const clients = [];
    for (const clientData of clientsData) {
      const client = new Client({
        ...clientData,
        stationEnrolement: station._id
      });
      await client.save();
      clients.push(client);

      // Initialize points for each client
      const points = new Points({
        clientSid: client.sid,
        totalPoints: 0,
        pointsHistory: []
      });
      await points.save();
    }
    console.log('✅ Sample clients created:', clients.length);

    // 7. Create sample transactions
    console.log('💳 Creating sample transactions...');
    const transactionsData = [
      { clientSid: 'SID001', amountFCFA: 15000, litres: 20, auditId: 'TXN001' },
      { clientSid: 'SID002', amountFCFA: 8000, litres: 10, auditId: 'TXN002' },
      { clientSid: 'SID001', amountFCFA: 25000, litres: 30, auditId: 'TXN003' },
      { clientSid: 'SID003', amountFCFA: 12000, litres: 15, auditId: 'TXN004' },
      { clientSid: 'SID002', amountFCFA: 35000, litres: 40, auditId: 'TXN005' },
      { clientSid: 'SID004', amountFCFA: 6000, litres: 8, auditId: 'TXN006' },
      { clientSid: 'SID005', amountFCFA: 18000, litres: 25, auditId: 'TXN007' },
      { clientSid: 'SID003', amountFCFA: 45000, litres: 50, auditId: 'TXN008' }
    ];

    const transactions = [];
    for (let i = 0; i < transactionsData.length; i++) {
      const txnData = transactionsData[i];
      const transaction = new Transaction({
        auditId: txnData.auditId,
        clientSid: txnData.clientSid,
        stationId: station._id,
        pompisteId: pompiste._id,
        deviceId: `DEVICE${String(i + 1).padStart(3, '0')}`,
        localTimestamp: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Spread over days
        amountFCFA: txnData.amountFCFA,
        litres: txnData.litres,
        status: 'synced'
      });
      await transaction.save();
      transactions.push(transaction);

      // Update points for the client
      const pointsAwarded = Math.floor(txnData.amountFCFA / 1000); // 1 point per 1000 FCFA
      await Points.findOneAndUpdate(
        { clientSid: txnData.clientSid },
        {
          $inc: { totalPoints: pointsAwarded },
          $push: {
            pointsHistory: {
              transactionId: transaction._id,
              points: pointsAwarded,
              date: new Date()
            }
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );

      // Generate bons if threshold reached
      const clientPoints = await Points.findOne({ clientSid: txnData.clientSid });
      if (clientPoints && clientPoints.totalPoints >= 10) { // Simple threshold for demo
        const bon = new Bon({
          code: `BON${txnData.auditId}`,
          clientSid: txnData.clientSid,
          stationId: station._id,
          montantFCFA: 500,
          generatedByTransaction: transaction._id,
          status: 'available',
          dateExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          ruleVersion: rule.version
        });
        await bon.save();
      }
    }
    console.log('✅ Sample transactions created:', transactions.length);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@sido-sarl.com / admin123');
    console.log('Manager: fatou.sow@sido-sarl.com / manager123');
    console.log('Pompiste: ahmed.diop@sido-sarl.com / pompiste123');
    console.log('\n📊 Sample Data Created:');
    console.log(`- Stations: 1 (${station.code})`);
    console.log(`- Users: 3 (1 admin, 1 manager, 1 pompiste)`);
    console.log(`- Clients: ${clients.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log('- Bonus Rules: 1');
    console.log('- Bons: Generated automatically based on thresholds');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('📪 Disconnected from MongoDB');
    } catch (e) {
      console.warn('⚠️ Erreur lors de la déconnexion de MongoDB (ignorée) :', e);
    }
  }
}

// Exécution si lancé directement
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

// Export pour usage programmatique (tests / scripts)
export default seedDatabase;
