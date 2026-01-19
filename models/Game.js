const mongoose = require('mongoose');

const ImageResourceSchema = new mongoose.Schema({
  thumb: String,
  original: String
}, { _id: false });

const MultilingualStringSchema = new mongoose.Schema({
  en: String,
  fr: String
}, { _id: false });

const MultilingualArraySchema = new mongoose.Schema({
  en: [String],
  fr: [String]
}, { _id: false });

const GameSchema = new mongoose.Schema({
  game_id: { type: Number, required: true, unique: true }, // ID unique technique
  title: { type: String, required: true },
  description: MultilingualStringSchema,
  platforms: [String],
  genres: MultilingualArraySchema,
  cover: ImageResourceSchema,
  developers: [String],
  publishers: [String],
  artworks: [ImageResourceSchema],
  game_modes: MultilingualArraySchema,
  player_perspectives: MultilingualArraySchema,
  themes: MultilingualArraySchema,
  franchises: [String],
  dlcs: [String],
  game_engines: [String],
  videos: [String],
  release_date: { type: String },
  added: { type: Number, default: 0 } // Popularité
}, { timestamps: true });

// Index pour la recherche textuelle
GameSchema.index({ title: 'text', 'developers': 'text', 'publishers': 'text' });

module.exports = mongoose.model('Game', GameSchema);
