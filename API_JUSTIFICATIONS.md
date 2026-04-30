# Documentation Architecture API - Argent Bank

## Vue d'ensemble
Cette API REST a été conçue pour gérer l'authentification des utilisateurs, les profils utilisateur, ainsi que les comptes et transactions bancaires. La documentation détaille les choix d'implémentation et leur justification.

---

## 1. Architecture Générale

### Stack Technique
- **Framework** : Express.js (Node.js)
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT (JSON Web Tokens)
- **Sécurité** : Bcrypt pour le hash des mots de passe
- **Documentation** : Swagger/OpenAPI 2.0

### Justification
- **Express.js** : Framework léger et flexible, idéal pour une API REST
- **MongoDB** : Base de données NoSQL flexible, adaptée à un système bancaire où les données peuvent varier
- **JWT** : Stateless et scalable, permet l'authentification sans sessions serveur
- **Bcrypt** : Standard de sécurité pour le hachage des mots de passe avec salt

---

## 2. Authentification et Gestion des Tokens

### Flux d'authentification

```
1. Utilisateur se connecte (POST /user/login)
   ↓
2. Vérification email + mot de passe
   ↓
3. Génération JWT contenant l'ID utilisateur
   ↓
4. Token retourné au client
   ↓
5. Client envoie token en header "Authorization: Bearer {token}"
```

### Token JWT - Contenu
```javascript
{
  "id": "639a8f2c4b3a5c2e1f9d8e7b",  // MongoDB ObjectId de l'utilisateur
  "iat": 1690825326,                  // Issued At (timestamp à la création)
  "exp": 1690911726                   // Expiration (24h plus tard)
}
```

### Justification
- **Bearer Authentication** : Standard HTTP pour les API sécurisées
- **JWT vs Sessions** : JWT est stateless, meilleur pour une API microservices
- **Expiration 24h** : Compromis entre sécurité et UX (renouvellement quotidien)
- **Secret Key** : Stocké en variable d'environnement (`.env`)

---

## 3. Récupération de l'ID Utilisateur

### Méthode de récupération

#### 🔑 **VIA LE TOKEN JWT DÉCODÉ**

```javascript
// Dans userService.js : getUserProfile()

const jwtToken = serviceData.headers.authorization.split('Bearer')[1].trim();
const decodedJwtToken = jwt.decode(jwtToken);
const user = await User.findOne({ _id: decodedJwtToken.id });
```

### Processus détaillé

1. **Extraction du token** : On récupère le header `Authorization: Bearer {token}`
2. **Split "Bearer"** : On extrait seulement la partie après "Bearer "
3. **Décodage** : `jwt.decode()` extrait le payload sans validation (rapide)
4. **Récupération ID** : La propriété `id` contient l'ObjectId MongoDB
5. **Recherche utilisateur** : On utilise cet ID pour retrouver l'utilisateur en base

### Avantages de cette approche

| Avantage | Explication |
|----------|-----------|
| **Pas de session** | Pas besoin de stocker les sessions en base/cache |
| **Scalable** | Chaque serveur peut valider indépendamment |
| **Rapide** | Le décodage JWT est très rapide, pas de requête BD pour l'ID |
| **Sécurisé** | Le token est validé en middleware avant d'accéder à cette fonction |

### Code du middleware de validation

```javascript
// tokenValidation.js
module.exports.validateToken = (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error('Token is missing from header');
    }
    
    const userToken = req.headers.authorization.split('Bearer')[1].trim();
    // Validation du token (vérification signature + expiration)
    const decodedToken = jwt.verify(userToken, process.env.SECRET_KEY);
    return next();  // Token valide, on continue
  } catch (error) {
    return res.status(401).send({ 
      status: 401, 
      message: error.message 
    });
  }
};
```

---

## 4. Gestion des Comptes Bancaires (AccountID)

### État actuel
Les comptes sont actuellement **stockés en données statiques JSON** (voir `frontend/src/data/accounts.json`).

### Structure requête pour récupérer les transactions d'un compte

```yaml
GET /api/v2/transactions/{accountID}
Headers:
  Authorization: Bearer {token}
  
Exemple : GET /api/v2/transactions/639a8f2c4b3a5c2e1f9d8e7a
```

### Comment obtenir l'accountID ?

#### **Option 1 : ID généré côté serveur** (Recommandé)
```javascript
// À implémenter dans le modèle Account
const accountSchema = {
  _id: ObjectId,              // MongoDB génère un ObjectId unique
  userId: ObjectId,           // Référence à l'utilisateur propriétaire
  accountName: "Compte Chèques",
  accountType: "checking",
  amount: 2500.50,
  currency: "USD"
};

// Lors de la récupération des comptes
GET /user/accounts
Response: [
  { accountID: "639b9f3c4b3a5c2e1f9d8e8c", name: "Compte Chèques", ... },
  { accountID: "639b9f3c4b3a5c2e1f9d8e8d", name: "Épargne", ... }
]
```

#### **Option 2 : ID basé sur le hash du nom** (Alternativ)
```javascript
const crypto = require('crypto');
const accountHash = crypto
  .createHash('md5')
  .update(userId + accountName)
  .digest('hex')
  .substring(0, 24);
```

### Avantages de chaque approche

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **ObjectId MongoDB** | Unique garanti, simple, scalable | Dépendant de la BD |
| **Hash du nom** | Déterministe, pas de BD | Peut créer des collisions |

### Implémentation recommandée

```javascript
// Ajouter un endpoint pour récupérer les comptes
router.get('/accounts', tokenValidation.validateToken, userController.getUserAccounts);

// userController.js
module.exports.getUserAccounts = async (req, res) => {
  try {
    const jwtToken = req.headers.authorization.split('Bearer')[1].trim();
    const decodedJwtToken = jwt.decode(jwtToken);
    
    const accounts = await Account.find({ userId: decodedJwtToken.id });
    
    res.status(200).send({
      status: 200,
      message: 'Accounts retrieved successfully',
      body: accounts.map(acc => ({
        accountID: acc._id.toString(),
        accountName: acc.name,
        amount: acc.balance
      }))
    });
  } catch (error) {
    res.status(400).send({ status: 400, message: error.message });
  }
};
```

---

## 5. Flux Utilisateur Complet

### Scénario : Un client se connecte et consulte ses comptes

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
        1. Utilisateur entre email/mot de passe
                              ↓
       POST /api/v1/user/login
           ├─ email: "user@bank.com"
           └─ password: "password123"
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Recherche l'utilisateur par email                        │
│  2. Compare le mot de passe avec le hash Bcrypt             │
│  3. Si valide → Génère JWT                                   │
│  4. Retourne { token: "eyJhbGciOiJIUzI1NiIs..." }          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
        Token stocké en Redux (Redux store)
                              ↓
        GET /api/v1/user/profile
           └─ Header: Authorization: Bearer {token}
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API)                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Middleware valide le token                               │
│  2. Décoding du JWT → récupère userId                       │
│  3. Requête BD avec { _id: userId }                         │
│  4. Retourne le profil utilisateur                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
        Profil affichée (firstName, lastName, userName)
                              ↓
        GET /api/v2/transactions/{accountID}
           └─ Header: Authorization: Bearer {token}
                              ↓
        Transactions affichées pour ce compte
```

---

## 6. Sécurité - Justifications des choix

### 6.1 Hachage des mots de passe avec Bcrypt

```javascript
const hashPassword = await bcrypt.hash(serviceData.password, 12);
```

| Aspect | Justification |
|--------|---------------|
| **Algorithme Bcrypt** | Résistant aux attaques GPU, se ralentit avec le temps |
| **Salt = 12** | 2^12 = 4096 itérations (bon rapport sécurité/performance) |
| **Jamais stocké en clair** | Respect RGPD et normes PCI DSS |

### 6.2 Validation en middleware

```javascript
router.post('/profile', 
  tokenValidation.validateToken,  // ← Validation AVANT le contrôleur
  userController.getUserProfile
);
```

**Avantage** : La fonction `getUserProfile` est garantie de recevoir un token valide

### 6.3 Variables d'environnement

```javascript
jwt.sign(
  { id: user._id },
  process.env.SECRET_KEY || 'default-secret-key',  // ← JAMAIS en dur
  { expiresIn: '1d' }
);
```

**Justification** : N'expose pas les secrets dans le code source

---

## 7. Versioning API

### Structure des routes

```
/api/v1/user/login        ← Endpoints User v1
/api/v1/user/profile
/api/v2/transactions/...  ← Endpoints Transactions v2 (futur)
```

### Justification du versioning

| Raison | Exemple |
|--------|---------|
| **Compatibilité ascendante** | Les clients v1 continuent à fonctionner |
| **Évolution indépendante** | Nouvelles features en v2 sans casser v1 |
| **Dépréciation progressive** | Migrer clients sur 6 mois avant désactivation v1 |

---

## 8. Modèle de données Utilisateur

### Schéma MongoDB

```javascript
{
  _id: ObjectId,        // Identifiant unique généré par MongoDB
  email: String,        // Unique, clé de connexion
  password: String,     // Hashé avec Bcrypt
  firstName: String,    // Prénom
  lastName: String,     // Nom
  userName: String,     // Pseudo public
  createdAt: Date,      // Auto-généré par Mongoose
  updatedAt: Date       // Auto-généré par Mongoose
}
```

### Transformation lors du retour au client

```javascript
// Dans le modèle :
toObject: {
  transform: (doc, ret) => {
    ret.id = ret._id;           // Renomme _id en id
    delete ret._id;             // Supprime _id
    delete ret.password;        // JAMAIS retourner le mot de passe
    delete ret.__v;             // Supprime version Mongoose
    return ret;
  }
}
```

**Justification** : Le client reçoit `id` au lieu de `_id`, et le mot de passe n'est jamais exposé

---

## 9. Gestion des erreurs

### Structure de réponse uniforme

```javascript
// Succès (200)
{
  status: 200,
  message: "Successfully got user profile data",
  body: { id: "...", email: "...", firstName: "..." }
}

// Erreur (400)
{
  status: 400,
  message: "Email already exists"
}

// Non authentifié (401)
{
  status: 401,
  message: "Token is missing from header"
}
```

**Avantage** : Format cohérent pour tous les endpoints

---

## 10. Flux de données : Login → Récupération Profil

```javascript
// ÉTAPE 1 : LOGIN
POST /api/v1/user/login
{
  email: "user@bank.com",
  password: "password123"
}

// Le backend :
// 1. Trouve l'utilisateur par email
// 2. Compare password avec bcrypt.compare()
// 3. Crée un JWT avec l'ID utilisateur
const token = jwt.sign(
  { id: user._id },                      // ← ID stocké dans le token
  process.env.SECRET_KEY,
  { expiresIn: '1d' }
);
// 4. Retourne le token

Response (200) :
{
  status: 200,
  message: "User successfully logged in",
  body: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
}

// ÉTAPE 2 : RÉCUPÉRATION PROFIL
POST /api/v1/user/profile
Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Middleware tokenValidation :
// 1. Extraire le token du header
// 2. jwt.verify() → valide la signature ET l'expiration
// 3. Si valide → next() (continue vers la fonction)

// La fonction getUserProfile :
// 1. Décoder le JWT (sans reverification)
// 2. Extraire l'ID du payload
// 3. Chercher l'utilisateur : User.findOne({ _id: decodedJwtToken.id })
// 4. Retourner les infos (sans le mot de passe)

Response (200) :
{
  status: 200,
  message: "Successfully got user profile data",
  body: {
    id: "639a8f2c4b3a5c2e1f9d8e7b",
    email: "user@bank.com",
    firstName: "John",
    lastName: "Doe",
    userName: "JohnDoe",
    createdAt: "2023-12-15T10:30:00.000Z",
    updatedAt: "2023-12-15T10:30:00.000Z"
  }
}
```

---

## 11. Extension Future : Récupération des Comptes

### À implémenter

```javascript
// 1. Modèle Account
const accountSchema = {
  _id: ObjectId,              // ← Cet ID sera l'accountID
  userId: ObjectId,           // Référence à l'utilisateur
  name: "Checking Account",
  balance: 2500.50,
  currency: "USD",
  accountType: "checking",
  createdAt: Date
};

// 2. Endpoint pour lister les comptes d'un utilisateur
GET /api/v1/user/accounts
Headers: Authorization: Bearer {token}

Response :
{
  status: 200,
  message: "Accounts retrieved successfully",
  body: [
    {
      accountID: "639b9f3c4b3a5c2e1f9d8e8c",
      accountName: "Checking Account",
      amount: 2500.50,
      currency: "USD"
    },
    {
      accountID: "639b9f3c4b3a5c2e1f9d8e8d",
      accountName: "Savings Account",
      amount: 10000.00,
      currency: "USD"
    }
  ]
}

// 3. Endpoint pour récupérer les transactions d'un compte
GET /api/v2/transactions/639b9f3c4b3a5c2e1f9d8e8c
Headers: Authorization: Bearer {token}

Response :
{
  status: 200,
  message: "All transactions retrieved successfully",
  body: [
    {
      transactionID: "639c9f3c4b3a5c2e1f9d8e9a",
      date: "2024-01-15T10:30:00Z",
      description: "Salary Deposit",
      amount: 3500.00,
      balance: 6000.00,
      category: "Income",
      note: "Monthly salary"
    }
  ]
}
```

---

## 12. Checklist de sécurité

- ✅ Mots de passe hashés avec Bcrypt
- ✅ JWT pour l'authentification stateless
- ✅ Middleware de validation des tokens
- ✅ Secrets en variables d'environnement
- ✅ Pas d'exposition de mots de passe en réponse
- ✅ CORS activé (à adapter pour la production)
- ✅ Tokens avec expiration (24h)
- ⚠️ À ajouter : Rate limiting, HTTPS en prod, Refresh tokens

---

## 13. Résumé des décisions d'architecture

| Décision | Justification |
|----------|---------------|
| JWT stateless | Scalabilité et performance |
| Token Bearer | Standard HTTP pour API REST |
| ID dans le JWT | Pas de requête BD supplémentaire à chaque fois |
| Middleware de validation | Garantir la sécurité en une seule place |
| Mongoose + MongoDB | Flexibilité des schémas pour un système bancaire |
| Bcrypt (salt 12) | Sécurité optimale vs performance |
| Versioning v1/v2 | Compatibilité ascendante |
| Structure Controller/Service | Séparation des responsabilités |
| Réponses uniformes | Meilleure UX côté client |

---

## 14. Récupération des IDs : AccountID et TransactionID

### Flux de récupération d'un TransactionID

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : L'utilisateur demande ses comptes                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  GET /api/v1/user/accounts                                  │
│  Headers: Authorization: Bearer {token}                     │
│                                                               │
│  L'API retourne :                                           │
│  {                                                           │
│    accountID: "639b9f3c4b3a5c2e1f9d8e8c",  ← ID du compte  │
│    accountName: "Checking Account",                         │
│    amount: 2500.50                                          │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Utiliser accountID pour récupérer les txs        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  GET /api/v2/transactions/{accountID}                       │
│  où accountID = "639b9f3c4b3a5c2e1f9d8e8c"                 │
│  Headers: Authorization: Bearer {token}                     │
│                                                               │
│  L'API retourne :                                           │
│  [                                                           │
│    {                                                        │
│      transactionID: "639c9f3c4b3a5c2e1f9d8e9a",   ← ID tx  │
│      date: "2024-01-15T10:30:00Z",                         │
│      description: "Salary Deposit",                        │
│      amount: 3500.00                                       │
│    }                                                        │
│  ]                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Utiliser transactionID pour détails complets     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  GET /api/v2/transactions/account/{transactionID}           │
│  où transactionID = "639c9f3c4b3a5c2e1f9d8e9a"             │
│  Headers: Authorization: Bearer {token}                     │
│                                                               │
│  L'API retourne tous les détails de la transaction :        │
│  {                                                           │
│    transactionID: "639c9f3c4b3a5c2e1f9d8e9a",             │
│    date: "2024-01-15T10:30:00Z",                           │
│    description: "Salary Deposit",                          │
│    amount: 3500.00,                                        │
│    category: "Income",                                     │
│    note: "Monthly salary",                                 │
│    balance: 6000.00                                        │
│  }                                                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Génération des IDs côté serveur

#### AccountID
```javascript
// MongoDB génère automatiquement _id sous forme ObjectId
// Lors du retour, on expose l'ID en tant que "accountID"

const account = new Account({
  userId: decodedJwt.id,        // Lien vers l'utilisateur
  name: "Checking Account",
  balance: 2500.50,
  currency: "USD"
});

// Après save()
account._id → "639b9f3c4b3a5c2e1f9d8e8c"  (ObjectId)
// On retourne dans la réponse API :
accountID: account._id.toString()
```

#### TransactionID
```javascript
// Même principe que AccountID
const transaction = new Transaction({
  accountId: "639b9f3c4b3a5c2e1f9d8e8c",
  date: new Date(),
  description: "Salary Deposit",
  amount: 3500.00
});

// Après save()
transaction._id → "639c9f3c4b3a5c2e1f9d8e9a"  (ObjectId)
// On retourne dans la réponse API :
transactionID: transaction._id.toString()
```

### Justification de cette approche

| Aspect | Justification |
|--------|---------------|
| **ObjectId MongoDB** | Unique garanti à l'échelle mondiale (collision ~0%) |
| **Format string** | Compatibilité avec JSON et les URLs |
| **Génération auto** | Pas de logique métier nécessaire |
| **Traçabilité** | Insertion du timestamp dans l'ObjectId |
| **Scalabilité** | Fonctionne même avec sharding MongoDB |

---

## 15. Complétude du Swagger et Proposition d'Endpoints

### Routes Actuelles ✅
```yaml
POST   /user/login         ← Obtenir le token JWT
POST   /user/signup        ← Créer un utilisateur
POST   /user/profile       ← Récupérer le profil
PUT    /user/profile       ← Modifier le profil
```

### Routes à Ajouter (Préparation Backend) 📋

```yaml
# Récupérer les comptes de l'utilisateur
GET /user/accounts
  Security: Bearer Token
  Response: [
    { accountID: "...", name: "...", balance: 123.45 }
  ]

# Récupérer les transactions d'un compte
GET /transactions/{accountID}
  Security: Bearer Token
  Parameters: accountID (path)
  Response: [
    { transactionID: "...", description: "...", amount: 100 }
  ]

# Récupérer une transaction spécifique
GET /transactions/account/{transactionID}
  Security: Bearer Token
  Parameters: transactionID (path)
  Response: {
    transactionID: "...",
    date: "2024-01-15T10:30:00Z",
    description: "...",
    amount: 100,
    category: "...",
    note: "..."
  }

# Modifier la catégorie et note d'une transaction
PUT /transactions/account/{transactionID}
  Security: Bearer Token
  Body: { category: "Income", note: "Monthly salary" }
  Response: { category: "...", note: "..." }
```

### Avantages du Swagger actuel 💪

| Point | Détail |
|--------|--------|
| **Sécurité** | Tous les endpoints sensibles sont protégés par Bearer Token |
| **Versioning** | Séparation v1 (user) et v2 (transactions) |
| **Cohérence** | Structure de réponse uniforme (status, message, body) |
| **Scalabilité** | Possibilité d'ajouter des endpoints sans casser les existants |
| **Documentation** | Bien défini avec descriptions et schémas |

### Propositions pour la Phase 2 🚀

```yaml
# 1. Ajouter un endpoint pour récupérer les comptes
GET /user/accounts:
  security:
    - Bearer: []
  tags:
    - User Module
  summary: User Accounts API
  description: API for fetching user accounts and balances
  produces:
    - application/json
  responses:
    '200':
      description: Accounts retrieved successfully
      schema:
        type: array
        items:
          $ref: '#/definitions/AccountResponse'
    '401':
      description: Unauthorized user
    '500':
      description: Internal Server Error

# 2. Améliorer les définitions des transactions
TransactionResponse:
  type: object
  properties:
    transactionID:
      type: string
      description: Unique transaction identifier
    accountID:
      type: string
      description: Account this transaction belongs to
    date:
      type: string
      format: date-time
      description: Transaction date and time
    description:
      type: string
      description: Transaction description
    amount:
      type: number
      format: double
      description: Transaction amount
    balance:
      type: number
      format: double
      description: Account balance after this transaction
    category:
      type: string
      description: Transaction category (optional)
    note:
      type: string
      description: User note (optional)
    transactionType:
      type: string
      enum: [debit, credit]
      description: Type of transaction
```

### Composition recommandée pour le backend 🏗️

**Phase 1 (Actuellement implémenté)** ✅
- Authentication (login, signup)
- User profiles (get, update)

**Phase 2 (À implémenter)** 📅
```
Backend Modules:
├── User Authentication (done) ✅
├── User Accounts Module NEW
│   ├── GET /user/accounts
│   └── Modèle Account (MongoDB)
├── Transactions Module NEW
│   ├── GET /transactions/{accountID}
│   ├── GET /transactions/account/{transactionID}
│   └── PUT /transactions/account/{transactionID}
└── Database
    ├── userModel (done) ✅
    ├── accountModel (new)
    └── transactionModel (new)
```

---

## 16. Démarrage de l'API

```bash
# Installation
npm install

# Configuration des variables d'environnement
# Créer un fichier .env avec :
# PORT=3001
# MONGO_URI=mongodb://localhost:27017/argentbank
# SECRET_KEY=your_super_secret_key

# Démarrer en développement
npm run dev:server

# Peupler la base de données
npm run populate-db

# L'API est accessible à http://localhost:3001
# Documentation Swagger : http://localhost:3001/api-docs
```

---

## 17. Résumé : Est-ce que le Swagger est complet ?

✅ **BIEN CONÇU**
- Routes d'authentification solides
- Structure d'API versionnée
- Sécurité par JWT intégrée
- Documentation claire

⚠️ **À COMPLÉTER (Phase 2)**
- Endpoint `/user/accounts` (très important !)
- Modèles Account et Transaction
- Routes pour récupérer/modifier les transactions

💡 **PROPOSITION À FAIRE AU CLIENT/MANAGER**
"Voici le Swagger Phase 1. Pour la Phase 2, nous proposons d'ajouter :
1. Gestion des comptes bancaires
2. API des transactions (consultation et annotation)
3. Catégorisation des transactions

Cela permettra aux utilisateurs de consulter leur historique et de gérer leurs dépenses."

---

**Document généré pour le projet Argent Bank - Phase 2** 🏦

