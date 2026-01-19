const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

router.get('/', gameController.getGames);
router.get('/search', gameController.getGames);
router.get('/category', gameController.getGames);
router.get('/popular', gameController.getPopular);
router.get('/filters', gameController.getFilters);
router.get('/random-genres', gameController.getRandomGenres);
router.get('/:id', gameController.getGameById);

module.exports = router;
