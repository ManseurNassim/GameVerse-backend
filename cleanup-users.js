const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gameLibrary';
    await mongoose.connect(uri);

    const result = await User.deleteMany({});
    console.log(`Utilisateurs supprimés: ${result.deletedCount}`);
  } catch (err) {
    console.error('Échec du nettoyage:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
