const nodemailer = require('nodemailer');

/**
 * Configuration du transporteur email
 */
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT);
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

/**
 * Envoi d'email de vérification
 */
exports.sendVerificationEmail = async (email, username, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/#/verify-email/${token}`;

  const mailOptions = {
    from: `"GameVerse" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Vérifiez votre compte GameVerse',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #0e0f10; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #1c1e22; border-radius: 12px; overflow: hidden; border: 1px solid #2a2f35; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: bold; color: white; }
          .content { padding: 40px 30px; }
          .content p { line-height: 1.6; color: #d1d5db; margin: 16px 0; }
          .button { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; margin: 24px 0; transition: background-color 0.3s; }
          .button:hover { background-color: #2563eb; }
          .footer { padding: 20px 30px; background-color: #15171a; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #2a2f35; }
          .warning { background-color: #422006; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
          .warning p { margin: 0; color: #fbbf24; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 GameVerse</h1>
          </div>
          <div class="content">
            <h2 style="color: #3b82f6; margin-top: 0;">Bienvenue ${username} !</h2>
            <p>Merci de vous être inscrit sur GameVerse. Pour finaliser votre inscription et accéder à toutes les fonctionnalités, veuillez vérifier votre adresse email.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Vérifier mon email</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">Ou copiez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background-color: #0e0f10; padding: 12px; border-radius: 6px; font-size: 12px; color: #60a5fa; border: 1px solid #2a2f35;">${verificationUrl}</p>
            <div class="warning">
              <p><strong>⚠️ Important :</strong> Ce lien expirera dans 24 heures pour des raisons de sécurité.</p>
            </div>
            <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">Si vous n'avez pas créé de compte sur GameVerse, ignorez simplement cet email.</p>
          </div>
          <div class="footer">
            <p>© 2026 GameVerse. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Envoi d'email de confirmation après vérification
 */
exports.sendWelcomeEmail = async (email, username) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"GameVerse" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue sur GameVerse !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #0e0f10; color: #ffffff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #1c1e22; border-radius: 12px; overflow: hidden; border: 1px solid #2a2f35; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 32px; font-weight: bold; color: white; }
          .content { padding: 40px 30px; }
          .content p { line-height: 1.6; color: #d1d5db; margin: 16px 0; }
          .footer { padding: 20px 30px; background-color: #15171a; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #2a2f35; }
          .feature { background-color: #0e0f10; padding: 16px; margin: 12px 0; border-radius: 8px; border-left: 3px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Compte Vérifié !</h1>
          </div>
          <div class="content">
            <h2 style="color: #10b981; margin-top: 0;">Félicitations ${username} !</h2>
            <p>Votre compte GameVerse est maintenant activé. Vous pouvez profiter de toutes les fonctionnalités :</p>
            <div class="feature">
              <strong style="color: #10b981;">📚 Bibliothèque personnelle</strong>
              <p style="margin: 8px 0 0 0; font-size: 14px;">Ajoutez vos jeux favoris et gérez votre collection.</p>
            </div>
            <div class="feature">
              <strong style="color: #10b981;">🔍 Recherche avancée</strong>
              <p style="margin: 8px 0 0 0; font-size: 14px;">Explorez plus de 7500 jeux avec filtres intelligents.</p>
            </div>
            <div class="feature">
              <strong style="color: #10b981;">🏆 Classements</strong>
              <p style="margin: 8px 0 0 0; font-size: 14px;">Découvrez les jeux les plus populaires par genre et plateforme.</p>
            </div>
            <p style="margin-top: 32px;">Bonne exploration sur GameVerse !</p>
          </div>
          <div class="footer">
            <p>© 2026 GameVerse. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};
