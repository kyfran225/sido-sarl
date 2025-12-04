# SIDO - Programme de Fidélisation (Points Verts)

[![CI/CD](https://github.com/your-org/sido-sarl/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/sido-sarl/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Une application complète de fidélisation client pour stations-service, avec application mobile pompiste et interface web d'administration.

## 🏗️ Architecture

### Monorepo Structure
```
sido-sarl/
├── backend/           # API Node.js/Express
├── mobile/            # App React Native/Expo
├── admin-web/         # Interface admin Next.js
├── packages/shared/   # Types et utilitaires partagés
└── docs/             # Documentation
```

## 🛠️ Tech Stack Summary

### Backend
- **Node.js** + **Express.js**
- **MongoDB** avec **Mongoose**
- **JWT** pour l'authentification
- **bcrypt** pour le hashage des mots de passe
- **Winston** pour les logs

### Mobile (Pompiste)
- **React Native** + **Expo**
- **TypeScript**
- **expo-sqlite** pour la base locale
- **expo-barcode-scanner** pour QR codes
- **@tanstack/react-query** pour la gestion des données

### Web Admin
- **Next.js 14** + **TypeScript**
- **Tailwind CSS** pour le styling
- **@tanstack/react-query** pour les API calls
- **Cypress** pour les tests E2E

### Partagé
- **TypeScript** pour les types
- **ESLint** + **Prettier** pour la qualité du code

## 📦 Installation Steps

### Prérequis
- **Node.js** 18+
- **pnpm** (recommandé) ou npm
- **MongoDB** (local ou Atlas)
- **Expo CLI** pour le mobile

1. **Cloner le repo**
   ```bash
   git clone https://github.com/your-org/sido-sarl.git
   cd sido-sarl
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Démarrer MongoDB**
   ```bash
   # Avec Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Ou installer MongoDB localement
   ```

4. **Seeder la base de données**
   ```bash
   cd backend
   npm run seed
   ```

## 🚀 How to Run Backend

```bash
cd backend
npm run dev
```

Le backend sera disponible sur `http://localhost:3001`.

## 🚀 How to Run Admin

```bash
cd admin-web
npm run dev
```

L'interface admin sera disponible sur `http://localhost:3000`.

## 🔧 Environment Variables Reference

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/sido
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
BATCH_MAX_SIZE=200
```

### Admin Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_ENV=development
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_APP_ENV=development
```

## 📱 Utilisation

### Application Mobile (Pompiste)

1. **Connexion**: Utiliser les credentials pompiste
2. **Nouvelle Transaction**:
   - Scanner QR client ou saisir SID manuellement
   - Entrer montant et litres
   - Valider la transaction
3. **Recherche Client**: Chercher par nom, téléphone ou SID
4. **Synchronisation**: Transactions offline synchronisées automatiquement

### Interface Web Admin

1. **Connexion**: Interface d'administration
2. **Tableau de Bord**: KPIs et métriques en temps réel
3. **Gestion Clients**: CRUD complet des clients
4. **Transactions**: Historique et recherche
5. **Règles**: Configuration des paliers de points
6. **Rapports**: Exports et analyses

## 🧪 Tests

### Backend
```bash
cd backend
npm test              # Tests unitaires
npm run test:integration  # Tests d'intégration
```

### Mobile
```bash
cd mobile
npm test              # Tests unitaires
npm run test:e2e      # Tests E2E (avec Detox)
```

### Admin Web
```bash
cd admin-web
npm test              # Tests unitaires
npm run test:e2e      # Tests E2E (Cypress)
```

## 🚢 Déploiement

### Backend
```bash
cd backend
npm run build
npm start
```

### Admin Web (Vercel)
```bash
cd admin-web
npm run build
vercel --prod
```

### Mobile (Expo EAS)
```bash
cd mobile
eas build --platform android
eas build --platform ios
eas submit --platform android
eas submit --platform ios
```

## 🔒 Sécurité

- **Authentification JWT** avec refresh tokens
- **Chiffrement** des mots de passe (bcrypt)
- **Validation** des entrées avec Joi
- **Rate limiting** côté serveur
- **CORS** configuré
- **Audit logging** de toutes les actions critiques

## 📊 Monitoring

- **Logs structurés** avec Winston
- **Métriques** Prometheus (optionnel)
- **Alertes** sur taux d'échec élevé
- **Health checks** pour tous les services

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code
- **ESLint** + **Prettier** configurés
- **Conventional Commits** pour les messages
- **Tests** requis pour toute nouvelle fonctionnalité
- **TypeScript** strict mode activé

## 📝 API Documentation

### Endpoints Principaux

#### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `POST /api/auth/refresh` - Rafraîchir token
- `POST /api/auth/logout` - Déconnexion

#### Clients
- `GET /api/clients/search` - Recherche clients
- `GET /api/clients/:sid` - Détails client
- `POST /api/clients` - Créer client

#### Transactions
- `POST /api/transactions` - Nouvelle transaction
- `GET /api/transactions` - Liste transactions
- `POST /api/sync` - Synchronisation batch

#### Administration
- `GET /api/admin/dashboard` - Statistiques tableau de bord
- `GET /api/admin/rules` - Gestion des règles
- `GET /api/admin/audit` - Logs d'audit

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développement**: Équipe SIDO SARL
- **Design**: UX/UI SIDO
- **Architecture**: Tech Lead SIDO

## 📞 Support

Pour le support technique :
- 📧 support@sido-sarl.com
- 📱 +225 XX XX XX XX
- 💬 Discord: [Serveur SIDO](https://discord.gg/sido)

---

**SIDO SARL** - Programme de Fidélisation Points Verts 🟢
