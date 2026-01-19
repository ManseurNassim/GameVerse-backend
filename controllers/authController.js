const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

// Helper for tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { 
            user_id: user.user_id, 
            username: user.username, 
            email: user.email,
            createdAt: user.createdAt 
        },
        process.env.ACCES_JWT_SECRET,
        { expiresIn: '15m', algorithm: 'HS256' }
    );

    const refreshToken = jwt.sign(
        { user_id: user.user_id },
        process.env.REFRESH_JWT_SECRET,
        { expiresIn: '5d', algorithm: 'HS256' }
    );

    return { accessToken, refreshToken };
};

exports.login = async (req, res, next) => {
    try {
        const { user_email, user_pass } = req.body;
        if (!user_email || !user_pass) {
            return res.status(400).json({ message: "Email and password required" });
        }

        const user = await User.findOne({ email: user_email }).select('+pass');
        if (!user || !(await bcrypt.compare(user_pass, user.pass))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.emailVerified) {
            return res.status(403).json({ 
                message: "Please verify your email before logging in. Check your inbox.",
                emailNotVerified: true
            });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Send Refresh Token as HttpOnly Cookie
        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,                     // secure only in prod (https)
            sameSite: isProd ? 'None' : 'Lax',  // None for cross-site (frontend on Vercel, backend on Render)
            maxAge: 5 * 24 * 60 * 60 * 1000,    // 5 days
            signed: true
        });

        // Send Access Token in body
        res.status(200).json({ data: accessToken });

    } catch (error) {
        next(error);
    }
};

exports.register = async (req, res, next) => {
    try {
        const { user_email, user_username, user_pass } = req.body;
        
        if (!user_email || !user_username || !user_pass) {
             return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ $or: [{ email: user_email }, { username: user_username }] });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(user_pass, 10);

        const lastUser = await User.findOne().sort({ user_id: -1 }).lean();
        const nextUserId = (lastUser?.user_id || 0) + 1;

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await User.create({
            user_id: nextUserId,
            email: user_email,
            username: user_username,
            pass: hashedPassword,
            emailVerified: false,
            verificationToken,
            verificationTokenExpires: tokenExpiry
        });

        // Send email in background (non-blocking)
        sendVerificationEmail(user_email, user_username, verificationToken)
            .then(() => {
                console.log(`Verification email sent successfully to ${user_email}`);
            })
            .catch((emailError) => {
                console.error(`Email sending failed for ${user_email}:`, emailError.message);
            });

        // Respond immediately
        res.status(201).json({ 
            message: "Compte créé ! Un email de vérification a été envoyé (vérifiez vos spams). Si vous ne le recevez pas, contactez le support.",
            emailSent: true
        });

    } catch (error) {
        next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        // Clear cookie
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'None' : 'Lax',
            signed: true
        });
        
        // Optional: Blacklist access token in DB if strict security needed
        
        res.status(200).json({ message: "Logged out", removeAccessToken: true });
    } catch (error) {
        next(error);
    }
};

// Logic to check status and refresh access token if refresh token is valid
exports.checkStatus = async (req, res, next) => {
    const refreshToken = req.signedCookies.refreshToken;

    if (!refreshToken) {
        return res.status(200).json({ isConnected: false });
    }

    jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(200).json({ isConnected: false });
        }

        try {
            const user = await User.findOne({ user_id: decoded.user_id });
            if (!user) return res.status(200).json({ isConnected: false });

            // Generate NEW Access Token
            const accessToken = jwt.sign(
                { 
                    user_id: user.user_id, 
                    username: user.username, 
                    email: user.email,
                    createdAt: user.createdAt 
                },
                process.env.ACCES_JWT_SECRET,
                { expiresIn: '15m', algorithm: 'HS256' }
            );

            return res.status(200).json({ isConnected: true, newAccessToken: accessToken });
        } catch (dbError) {
            next(dbError);
        }
    });
};

/**
 * Vérification du token email
 */
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        console.log('[VERIFY EMAIL] Token reçu:', token);

        let user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            // Vérifier si l'utilisateur a déjà été vérifié avec ce token
            const alreadyVerified = await User.findOne({
                emailVerified: true,
                verificationToken: { $exists: false }
            });
            
            if (alreadyVerified) {
                console.log('[VERIFY EMAIL] Email déjà vérifié précédemment');
                return res.status(200).json({ 
                    message: "Email already verified successfully. You can now login.",
                    verified: true,
                    alreadyVerified: true
                });
            }
            
            console.log('[VERIFY EMAIL] Token invalide ou expiré');
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        console.log('[VERIFY EMAIL] Utilisateur trouvé:', user.email);
        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        console.log('[VERIFY EMAIL] Email vérifié avec succès');

        try {
            await sendWelcomeEmail(user.email, user.username);
        } catch (emailError) {
            console.error("Welcome email failed:", emailError);
        }

        res.status(200).json({ 
            message: "Email verified successfully. You can now login.",
            verified: true
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Renvoyer l'email de vérification
 */
exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: "Email already verified" });
        }

        // Limite: 1 envoi par minute
        if (user.lastVerificationEmailSent && 
            Date.now() - user.lastVerificationEmailSent.getTime() < 60 * 1000) {
            return res.status(429).json({ 
                message: "Please wait 1 minute before requesting another verification email",
                retryAfter: 60 
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        user.verificationToken = verificationToken;
        user.verificationTokenExpires = tokenExpiry;
        user.lastVerificationEmailSent = new Date();
        await user.save();

        await sendVerificationEmail(user.email, user.username, verificationToken);

        res.status(200).json({ 
            message: "Verification email resent successfully",
            emailSent: true
        });

    } catch (error) {
        next(error);
    }
};