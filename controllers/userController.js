const User = require('../models/User');

exports.toggleLibrary = async (req, res, next) => {
    try {
        const { gameId } = req.body;
        const userId = req.user.user_id; // Vient du middleware verifyToken

        if (!gameId) {
            return res.status(400).json({ message: "Game ID required" });
        }

        const user = await User.findOne({ user_id: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const index = user.game_list.indexOf(gameId);
        let action = '';

        if (index === -1) {
            // Ajouter
            user.game_list.push(gameId);
            action = 'added';
        } else {
            // Retirer
            user.game_list.splice(index, 1);
            action = 'removed';
        }

        await user.save();

        res.status(200).json({ 
            message: `Game ${action}`, 
            game_list: user.game_list 
        });

    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ user_id: req.user.user_id }).select('-pass');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};