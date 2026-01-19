const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Game = require('./models/Game');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const loadGames = () => {
  const candidates = [
    path.join(__dirname, '../originalprojet/GamesDATA.json'),
    path.join(__dirname, '../GamesDATA.json')
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed.games || parsed;
    }
  }

  console.warn('GamesDATA.json not found, seeding empty collection.');
  return [];
};

const games = loadGames();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gameLibrary');
    await Game.deleteMany({});
    if (games.length) {
      // Ajouter game_id séquentiellement pour chaque jeu
      const gamesWithIds = games.map((game, index) => ({
        ...game,
        game_id: index + 1
      }));
      await Game.insertMany(gamesWithIds);
    }
    console.log(`Database seeded with ${games.length} games.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
