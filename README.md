# GameVerse Backend

API Express + MongoDB pour GameVerse.

## Structure
```
backend/
├── controllers/      # auth, games, users
├── models/           # Game, User
├── routes/           # authRoutes, gameRoutes, userRoutes
├── middleware/       # authMiddleware
├── utils/            # helpers, logger, emailService
├── seed.js           # import jeux
├── seed-user.js      # import utilisateur de test
└── index.js          # serveur
```

## Architecture et fonctionnement
- Entrée serveur : `index.js` configure Express, CORS, JSON, et monte les routes.
- Routes → Middleware → Controllers → Models : les requêtes passent par `routes/*`, `authMiddleware` (pour les routes protégées), puis `controllers` qui utilisent `models` Mongoose.
- Helpers : `utils/helpers.js` pour validation, pagination, requêtes Mongo ; `utils/logger.js` pour logs adaptés à l'environnement.
- Authentification : JWT access + refresh (cookies httpOnly), mots de passe hashés bcrypt.
- Données : MongoDB Atlas héberge les collections `games` et `users` (MONGO_URI déjà en ligne).
- Flux : Client → API Express → MongoDB → réponse JSON ; la pagination et les filtres sont traités côté serveur.

## Démarrage local
```bash
cd backend
npm install
npm start       # ou: node index.js
# Seed jeux (optionnel)
node seed.js
```

## Configuration (.env)
```
PORT=5001
MONGO_URI=<mongo_uri>
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
NODE_ENV=production
```
Notes : secrets non versionnés ; MONGO_URI pointe vers Atlas (déjà en ligne).

## Endpoints principaux
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /games            (recherche/filtre + pagination)
- GET /games/filters    (filtres disponibles)
- GET /games/:id        (détails)
- GET /user/profile     (protégé)
- PUT /user/game/:gameId (toggle bibliothèque, protégé)

## Sécurité
- Hashing bcrypt des mots de passe
- JWT (access + refresh cookies httpOnly)
- Validation des entrées (helpers côté serveur)
- CORS : autoriser le domaine du front déployé

## Déploiement (Render)
- Service Web root : `backend/`
- Build : `npm install`
- Start : `node index.js`
- Variables d'env : PORT (fourni par Render), MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV=production

## Tests rapides
```bash
curl "http://localhost:5001/games?q=mario&genres=Aventure"
curl "http://localhost:5001/auth/login" -d '{"email":"...","password":"..."}' -H "Content-Type: application/json"
```
