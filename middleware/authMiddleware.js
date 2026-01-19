const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCES_JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // If expired, the frontend axios interceptor will handle the 401
        // and attempt to call /status to refresh using the cookie.
        return res.status(401).json({ message: "Invalid or Expired Token" });
    }
};