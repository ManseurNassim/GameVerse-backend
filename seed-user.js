const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const seedTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gameLibrary');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      console.log('Test user already exists: test@test.com');
      process.exit(0);
    }

    // Obtenir le dernier user_id
    const lastUser = await User.findOne().sort({ user_id: -1 }).lean();
    const nextUserId = (lastUser?.user_id || 0) + 1;

    // Créer l'utilisateur de test
    const hashedPassword = await bcrypt.hash('test123456', 10);
    
    const testUser = new User({
      user_id: nextUserId,
      username: 'TestUser',
      email: 'test@test.com',
      pass: hashedPassword,
      profile_picture: 'https://via.placeholder.com/150',
      bio: 'Test user for development',
      game_list: []
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedTestUser();
