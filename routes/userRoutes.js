const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/me', verifyToken, userController.getProfile);
router.post('/library/toggle', verifyToken, userController.toggleLibrary);

module.exports = router;