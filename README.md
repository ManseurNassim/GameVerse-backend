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
ACCES_JWT_SECRET=<secret>
REFRESH_JWT_SECRET=<secret>
COOKIE_SECRET=<secret>
RESEND_API_KEY=<resend_api_key>
FRONTEND_URL=https://gameverse.nassimmanseur.fr
NODE_ENV=production
```
Notes : 
- Secrets non versionnés ; MONGO_URI pointe vers Atlas.
- Email : utilise Resend API (gratuit jusqu'à 3000 emails/mois), plus fiable que SMTP sur les plateformes cloud.
- FRONTEND_URL : domaine de production du front pour les liens dans les emails de vérification.
- Les noms de variables doivent correspondre au code (ACCES_JWT_SECRET, REFRESH_JWT_SECRET, COOKIE_SECRET).

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
- CORS : domaines autorisés (localhost + domaine de prod front)
- Rate limiting : protection contre le spam (login, register, resend-verification)
- Trust proxy : activé pour détecter correctement l'IP client derrière les proxies cloud (Render, Vercel)

## Déploiement (Render)
- Service Web root : `backend/`
- Build : `npm install`
- Start : `node index.js`
- Variables d'env : 
  - PORT (fourni par Render)
  - MONGO_URI (Atlas)
  - ACCES_JWT_SECRET, REFRESH_JWT_SECRET, COOKIE_SECRET
  - RESEND_API_KEY (pour les emails)
  - FRONTEND_URL (domaine de prod du front)
  - NODE_ENV=production
- Trust proxy activé (`app.set('trust proxy', 1)`) pour rate limiting correct derrière le proxy Render

## Tests rapides
```bash
curl "http://localhost:5001/games?q=mario&genres=Aventure"
curl "http://localhost:5001/auth/login" -d '{"email":"...","password":"..."}' -H "Content-Type: application/json"
```
## Améliorations récentes (Jan 2026)
- **Filtrage amélioré** : Support pour thèmes avec descriptions (ex: "4X (explorer, étendre...)")
- **Tri personnalisé** : Nouveaux params `sortBy` et `sortOrder` pour trier par `added`, `rating`, `release_date`
- **Optimisation des requêtes** : `buildArrayQuery` corrigée pour traiter les valeurs avec virgules internes
- **RankingPage performante** : Chargement rapide des filtres via `/games/filters`, puis jeux à la demande avec pagination