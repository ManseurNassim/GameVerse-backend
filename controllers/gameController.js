const Game = require('../models/Game');
const { 
    asyncHandler, 
    buildArrayQuery, 
    buildTextSearchQuery, 
    parsePagination 
} = require('../utils/helpers');

// Obtenir tous les jeux avec filtres et recherche
exports.getGames = asyncHandler(async (req, res) => {
    const { q, genres, platforms, themes, developers, publishers, category, genresMode, platformsMode, themesMode, developersMode, publishersMode, sortBy, sortOrder } = req.query;
    let query = {};

    // 1. Recherche Textuelle
    if (q) {
        query = buildTextSearchQuery(q, ['title', 'developers', 'publishers']);
    }

    // 2. Filtres avec mode AND/OR
    if (genres) query['genres.fr'] = buildArrayQuery('genres.fr', genres, genresMode);
    if (platforms) query.platforms = buildArrayQuery('platforms', platforms, platformsMode);
    if (themes) query['themes.fr'] = buildArrayQuery('themes.fr', themes, themesMode);
    if (developers) query.developers = buildArrayQuery('developers', developers, developersMode);
    if (publishers) query.publishers = buildArrayQuery('publishers', publishers, publishersMode);

    // Cas spécial Home Page (category unique)
    if (category) {
        query['genres.fr'] = category;
        const games = await Game.aggregate([
            { $match: query },
            { $sample: { size: 7 } }
        ]);
        return res.status(200).json(games);
    }

    // Tri personnalisé (added, rating, release_date, etc.)
    let sortObject = {};
    if (sortBy) {
        const direction = sortOrder === 'asc' ? 1 : -1;
        sortObject[sortBy] = direction;
    } else {
        sortObject = { added: -1 }; // Défaut: tri par added descendant
    }

    // Pagination: si page/limit fournis, renvoyer data + total
    const { page, limit, skip } = parsePagination(req.query);
    if (req.query.page || req.query.limit) {
        const [total, games] = await Promise.all([
            Game.countDocuments(query),
            Game.find(query).sort(sortObject).skip(skip).limit(limit)
        ]);
        return res.status(200).json({ data: games, total, page, limit });
    }

    // Comportement legacy: renvoyer un tableau simple limité à 50
    const games = await Game.find(query).sort(sortObject).limit(50);
    res.status(200).json(games);
});

// Obtenir un jeu par ID (game_id legacy)
exports.getGameById = asyncHandler(async (req, res) => {
    const game = await Game.findOne({ game_id: req.params.id });
    if (!game) return res.status(404).json({ message: "Jeu non trouvé" });
    res.status(200).json(game);
});

// Obtenir les filtres disponibles (Optimisé avec distinct)
exports.getFilters = asyncHandler(async (req, res) => {
    // Exécution en parallèle pour gagner du temps
    const [genres, platforms, themes, developers, publishers] = await Promise.all([
        Game.distinct("genres.fr"),
        Game.distinct("platforms"),
        Game.distinct("themes.fr"),
        Game.distinct("developers"),
        Game.distinct("publishers")
    ]);

    res.status(200).json({
        genres: genres.sort(),
        platforms: platforms.sort(),
        themes: themes.sort(),
        developers: developers.sort(),
        publishers: publishers.sort(),
    });
});

// Obtenir les jeux populaires
exports.getPopular = asyncHandler(async (req, res) => {
    const games = await Game.find().sort({ added: -1 }).limit(20);
    res.status(200).json(games);
});

/**
 * Obtenir 3 genres aléatoires avec minimum 7 jeux chacun
 */
exports.getRandomGenres = asyncHandler(async (req, res) => {
    try {
        const genresWithCount = await Game.aggregate([
            { $match: { 'genres.fr': { $exists: true, $type: 'array' } } },
            { $unwind: { path: '$genres.fr', preserveNullAndEmptyArrays: false } },
            { $match: { 'genres.fr': { $ne: null, $ne: '' } } },
            { $group: { _id: '$genres.fr', count: { $sum: 1 } } },
            { $match: { count: { $gte: 7 } } },
            { $sort: { count: -1 } }
        ]);

        if (genresWithCount.length < 3) {
            return res.status(200).json(['Action', 'Aventure', 'Indépendant']);
        }

        const shuffled = genresWithCount.sort(() => 0.5 - Math.random());
        const genres = shuffled.slice(0, 3).map(g => g._id);
        
        res.status(200).json(genres);
    } catch (error) {
        console.error('Error in getRandomGenres:', error);
        res.status(200).json(['Action', 'Aventure', 'Indépendant']);
    }
});