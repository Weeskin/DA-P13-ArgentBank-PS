# 📚 Argent Bank API - Guide Complet

**Version :** 1.0.0  
**Documentation Swagger :** 2.0  
**Date :** 2026-04-30  
**Stack :** Express.js + MongoDB + JWT

---

## 📖 Table des matières

1. [🏗️ Architecture Générale](#architecture)
2. [🔄 Flux Utilisateur Complet](#flux-utilisateur)
3. [🔐 Sécurité & Authentification](#sécurité)
4. [📊 Endpoints & Modèles](#endpoints)
5. [🔍 FAQ - Réponses Techniques](#faq)
6. [✅ Checklist Implémentation](#checklist)

---

<a name="architecture"></a>
# 🏗️ Architecture Générale

## Stack Technique

```
┌─────────────────────────────────────────────────────────┐
│             CLIENT (React Front-end)                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
┌──────────────────────▼──────────────────────────────────┐
│         SERVER (localhost:3001)                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Framework : Express.js (Node.js)                   │  │
│  │ Authentification : JWT (Bearer Token)              │  │
│  │ Hachage password : Bcrypt (salt=12)                │  │
│  │ Versioning : v1 (user) + v2 (transactions)         │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│         DATABASE (MongoDB / Mongoose)                    │
│  ├─ Users Collection                                     │
│  ├─ Accounts Collection (userId → User)                 │
│  └─ Transactions Collection (accountId → Account)       │
└─────────────────────────────────────────────────────────┘
```

## Principes Clés

| Aspect | Justification |
|--------|---------------|
| **Express.js** | Framework léger et flexible pour API REST |
| **MongoDB** | NoSQL flexible, idéal pour système bancaire |
| **JWT Stateless** | Scalable, pas de session serveur nécessaire |
| **Bcrypt (salt 12)** | 4096 itérations = sécurité optimale vs performance |
| **Versioning v1/v2** | Compatibilité ascendante, évolution indépendante |
| **Bearer Token** | Standard HTTP sécurisé |

---

<a name="flux-utilisateur"></a>
# 🔄 Flux Utilisateur Complet

## 🎯 Les 5 Étapes (du login au détail transaction)

### Étape 1️⃣ : Login → obtenir le Token

```yaml
POST /api/v1/user/login
Content-Type: application/json

Request {
  email: "john@bank.com",
  password: "password123"
}

Response (200) {
  status: 200,
  message: "User successfully logged in",
  body: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Ce qu'il faut faire :**
- Sauvegarder le token en Redux/Context
- Utiliser ce token pour TOUS les appels suivants

**Token contient :**
```javascript
{
  id: "639a8f2c4b3a5c2e1f9d8e7b",  // ID utilisateur MongoDB
  iat: 1690825326,                  // Créé à
  exp: 1690911726                   // Expire dans 24h
}
```

---

### Étape 2️⃣ : Récupérer le Profil

```yaml
POST /api/v1/user/profile
Authorization: Bearer {token}

Response (200) {
  status: 200,
  message: "Successfully got user profile data",
  body: {
    email: "john@bank.com",
    firstName: "John",
    lastName: "Doe",
    userName: "JohnDoe"
  }
}
```

**Ce profil c'est :** Qui suis-je ? (personne, pas les comptes)

---

### Étape 3️⃣ : Récupérer les Comptes (NOUVEAU ✨)

```yaml
GET /api/v1/user/accounts
Authorization: Bearer {token}

Response (200) {
  status: 200,
  message: "Accounts retrieved successfully",
  body: [
    {
      accountID: "639b9f3c4b3a5c2e1f9d8e8c",
      accountName: "Checking Account",
      accountCurrency: "USD",
      amount: 2500.50,
      amountDescription: "Available Balance"
    },
    {
      accountID: "639b9f3c4b3a5c2e1f9d8e8d",
      accountName: "Savings Account",
      accountCurrency: "USD",
      amount: 10000.00,
      amountDescription: "Available Balance"
    }
  ]
}
```

**C'est ici qu'on récupère les accountID !**  
**Stocke-les pour l'étape 4.**

---

### Étape 4️⃣ : Récupérer les Transactions d'un compte

```yaml
GET /api/v2/transactions/{accountID}?page=1&limit=10&fromDate=2024-01-01&toDate=2024-01-31
Authorization: Bearer {token}

où accountID = "639b9f3c4b3a5c2e1f9d8e8c"  (reçu en Étape 3)

Response (200) {
  status: 200,
  message: "Transactions retrieved successfully",
  body: {
    accountID: "639b9f3c4b3a5c2e1f9d8e8c",
    page: 1,
    limit: 10,
    totalTransactions: 127,
    totalPages: 13,
    transactions: [
      {
        transactionID: "639c9f3c4b3a5c2e1f9d8e9a",
        accountID: "639b9f3c4b3a5c2e1f9d8e8c",
        date: "2024-01-15T10:30:00Z",
        description: "Salary Deposit",
        amount: 3500.00,
        balance: 6000.00,
        category: "Income",
        note: "Monthly salary"
      },
      {
        transactionID: "639c9f3c4b3a5c2e1f9d8e9b",
        accountID: "639b9f3c4b3a5c2e1f9d8e8c",
        date: "2024-01-14T14:20:00Z",
        description: "Grocery Store",
        amount: 125.50,
        balance: 2500.00,
        category: "Groceries",
        note: "Supermarché du coin"
      }
    ]
  }
}
```

**Query params optionnels :**
- `page` : numéro de page (défaut 1)
- `limit` : txs par page (défaut 10)
- `fromDate` : YYYY-MM-DD (inclus)
- `toDate` : YYYY-MM-DD (inclus)

---

### Étape 5️⃣ (Optionnel) : Modifier une Transaction

```yaml
PUT /api/v2/transactions/account/{transactionID}
Authorization: Bearer {token}

où transactionID = "639c9f3c4b3a5c2e1f9d8e9a"  (reçu en Étape 4)

Request {
  category: "Supermarket",
  note: "Courses rayon fruits"
}

Response (200) {
  status: 200,
  message: "Transaction updated successfully",
  body: {
    transactionID: "639c9f3c4b3a5c2e1f9d8e9a",
    category: "Supermarket",
    note: "Courses rayon fruits"
  }
}
```

---

## 🌳 Hiérarchie logique

```
┌─ Étape 1 ─────────────────┐
│  POST /v1/user/login      │ → Token
└──────────────┬─────────────┘
               │
┌──────────────▼─────────────┐
│ Étape 2                     │
│ POST /v1/user/profile       │ → Profil (Qui suis-je ?)
└──────────────┬─────────────┘
               │
┌──────────────▼─────────────┐
│ Étape 3                     │
│ GET /v1/user/accounts       │ → Comptes (Quels comptes j'ai ?)
└──────────────┬─────────────┘
               │ (pour chaque compte)
┌──────────────▼─────────────────────────────────┐
│ Étape 4                                         │
│ GET /v2/transactions/{accountID}                │ → Transactions
└──────────────┬─────────────────────────────────┘
               │ (pour chaque transaction)
┌──────────────▼─────────────────────────────────┐
│ Étape 5                                         │
│ PUT /v2/transactions/account/{transactionID}    │ → Annoter
└─────────────────────────────────────────────────┘
```

---

<a name="sécurité"></a>
# 🔐 Sécurité & Authentification

## Flux d'Authentification

```
1. Utilisateur POST /login (email + password)
         ↓
2. Backend cherche User par email
         ↓
3. Bcrypt compare(passwordEntrée, passwordEnBase)
         ↓
4. Si match → JWT.sign({ id: user._id }, SECRET_KEY, { expiresIn: '24h' })
         ↓
5. Server retourne token
         ↓
6. Client stocke token + envoie à chaque requête
         ↓
7. Middleware validateToken vérifie JWT.verify(token, SECRET_KEY)
         ↓
8. Si valide → next() | Sinon → 401 Unauthorized
```

## Corrélation Données & Sécurité

**CRUCIAL :** Chaque endpoint doit vérifier que l'utilisateur accède **uniquement ses propres données**

```typescript
// Pseudo-code backend

// ÉTAPE 1 : Middleware valide le token
router.get('/v1/user/accounts', validateToken, async (req, res) => {
  const userID = req.user.id;  // ← Extrait du JWT validé
  
  // ÉTAPE 2 : Cherche UNIQUEMENT les comptes de cet utilisateur
  const accounts = await Account.find({ userId: userID });
  //                                     ↑
  //               Sécurité : pas d'accès croisé
  
  return res.json({ body: accounts });
});

// ÉTAPE 3 : Double vérification pour les transactions
router.get('/v2/transactions/:accountID', validateToken, async (req, res) => {
  const userID = req.user.id;
  const accountID = req.params.accountID;
  
  // Vérif 1 : Le compte existe-t-il ?
  const account = await Account.findById(accountID);
  if (!account) return res.status(404).send({ message: "Not found" });
  
  // Vérif 2 : Cet utilisateur possède-t-il ce compte ?
  if (account.userId !== userID) {
    return res.status(403).send({ message: "Unauthorized" });
  }
  // ↑ John ne peut PAS accéder aux comptes de Marie
  
  const transactions = await Transaction.find({ accountId: accountID });
  return res.json({ body: transactions });
});
```

## Stockage & Bonnes Pratiques

| Élément | Stockage | Justification |
|---------|----------|---------------|
| **Secret Key** | `.env` (prod) | Jamais en dur dans le code |
| **Passwords** | Bcrypt hash (salt 12) | Non-réversible, résistant GPU |
| **Tokens** | JWT signé | Validable sans BD, expiration 24h |
| **Sessions** | ❌ Pas de session | Stateless = scalable |

---

<a name="endpoints"></a>
# 📊 Endpoints & Modèles

## Vue d'ensemble : Un Serveur, deux Versions

```
Serveur unique : localhost:3001
basePath: /api

V1 (User Module)          V2 (Transactions Module)
├ POST /v1/user/login     ├ GET /v2/categories
├ POST /v1/user/signup    ├ GET /v2/transactions/{accountID}
├ POST /v1/user/profile   ├ GET /v2/transactions/account/{transactionID}
├ PUT  /v1/user/profile   └ PUT /v2/transactions/account/{transactionID}
└ GET  /v1/user/accounts
```

## Endpoints Détaillés

### V1 : User Module (Authentification & Profil)

| HTTP | Route | Objectif | Auth | Body | Retour |
|------|-------|----------|------|------|--------|
| POST | `/v1/user/login` | Connexion | ❌ | email, password | {token} |
| POST | `/v1/user/signup` | Inscription | ❌ | email, password, firstName, lastName, userName | {id, email} |
| POST | `/v1/user/profile` | Récupérer profil | ✅ | — | {firstName, lastName, userName, email} |
| PUT | `/v1/user/profile` | Modifier profil | ✅ | firstName, lastName | {firstName, lastName, userName, email} |
| **GET** | **`/v1/user/accounts`** | **Récupérer comptes** | ✅ | — | **{[accountID, accountName, amount, ...]}** |

### V2 : Transactions Module

| HTTP | Route | Query Params | Auth | Retour |
|------|-------|--------------|------|--------|
| GET | `/v2/categories` | — | ✅ | {[{id, label}]} — contenu du dropdown |
| GET | `/v2/transactions/{accountID}` | page, limit, fromDate, toDate | ✅ | {transactions[], pagination} |
| GET | `/v2/transactions/account/{transactionID}` | — | ✅ | {transaction complète} |
| PUT | `/v2/transactions/account/{transactionID}` | — | ✅ | {transactionID, category, note} |

## Modèles de Données

### 1. User (Utilisateur)

```typescript
interface User {
  _id: ObjectId;              // MongoDB ID
  email: string;              // Unique
  password: string;           // Bcrypt hash
  firstName: string;
  lastName: string;
  userName: string;           // Pseudo public
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Account (Compte bancaire)

```typescript
interface Account {
  _id: ObjectId;              // Retourné comme accountID
  userId: ObjectId;           // ← Lien vers User
  accountName: string;        // "Checking", "Savings", etc.
  accountCurrency: string;    // "USD", "EUR", etc.
  amount: number;             // Solde courant
  amountDescription: string;  // "Available Balance"
  createdAt: Date;
}
```

### 3. Transaction (Opération)

```typescript
interface Transaction {
  _id: ObjectId;              // Retourné comme transactionID
  accountId: ObjectId;        // ← Lien vers Account
  date: Date;                 // ISO 8601
  description: string;        // "Salary Deposit", etc.
  amount: number;             // Montant (positif ou négatif)
  balance: number;            // Solde après la txn
  transactionType?: string;   // "debit" | "credit" (optionnel)
  category?: string;          // "Income", "Groceries", etc. (à définir)
  note?: string;              // Annotation utilisateur libre
  createdAt: Date;
}
```

---

<a name="faq"></a>
# 🔍 FAQ - Réponses Techniques

## Q1 : Dropdown / Category — où vient le contenu ?

**Décision retenue :** Endpoint dédié `GET /api/v2/categories` ✅

```yaml
GET /api/v2/categories
Authorization: Bearer {token}

Response (200) {
  status: 200,
  message: "Categories retrieved successfully",
  body: [
    { id: "income",        label: "Income" },
    { id: "groceries",     label: "Groceries" },
    { id: "utilities",     label: "Utilities" },
    { id: "entertainment", label: "Entertainment" },
    { id: "other",         label: "Other" }
  ]
}
```

**Justification :** Gérer les catégories côté serveur permet d'en ajouter, renommer ou supprimer sans modifier ni redéployer le frontend. Un administrateur peut faire évoluer la liste via une interface back-office. C'est le choix le plus scalable et modulable à long terme.

Le frontend envoie ensuite l'`id` (pas le `label`) dans le PUT transaction pour garantir la stabilité des références même si un libellé change.

---

## Q2 : Quelle route pour récupérer les `accountID` ?

**Réponse :** `GET /api/v1/user/accounts` (nouvellement ajoutée)

```yaml
GET /api/v1/user/accounts
Headers: Authorization: Bearer {token}

Response:
[
  { accountID: "639b9f3c4b3a5c2e1f9d8e8c", accountName: "Checking", ... },
  { accountID: "639b9f3c4b3a5c2e1f9d8e8d", accountName: "Savings", ... }
]
```

- **accountID** = MongoDB `_id` du compte
- Retourné comme **array**, pas imbriqué dans profil
- Un appel **séparé** du profil

---

## Q3 : PUT Transaction → à quoi correspond le `name` ?

**Avant :** Schéma confus avec `name`, `category`, `note`

**Maintenant :** Clarifié ✅

```yaml
PUT /api/v2/transactions/account/{transactionID}

Body {
  category: "Groceries",         ← Nilai from dropdown
  note: "Supermarché Carrefour"  ← Free text annotation
}

Response {
  transactionID: "...",
  category: "Groceries",
  note: "Supermarché Carrefour"
}
```

- `category` = valeur sélectionnée dans la liste déroulante
- `note` = annotation libre de l'utilisateur

---

## Q4 : Combien de transactions sont retournées ?

**Réponse :** Contrôlé par **pagination**

```yaml
GET /api/v2/transactions/{accountID}?page=1&limit=10

Response (200) {
  body: {
    accountID: "...",
    currentPage: 1,          ← Page actuelle
    limit: 10,               ← Par page
    totalTransactions: 127,  ← Total sur le compte
    totalPages: 13,          ← Nombre de pages
    transactions: [...]      ← Max 10 items
  }
}
```

**Défauts :**
- `page` = 1 (première page)
- `limit` = 10 (10 txs par page)

**Exemple :** Pages multiples
```
Page 1 : txs 1-10
Page 2 : txs 11-20
...
Page 13 : txs 121-127 (seulement 7)
```

---

## Q5 : Transactions sur une plage de dates ?

**Réponse :** Oui, via query params `fromDate` et `toDate`

```yaml
GET /api/v2/transactions/{accountID}?fromDate=2024-01-01&toDate=2024-01-31

Paramètres :
- fromDate : YYYY-MM-DD, date début (incluse)
- toDate : YYYY-MM-DD, date fin (incluse)

Exemples :

1. Tous les janvier 2024
   ?fromDate=2024-01-01&toDate=2024-01-31

2. Combiné avec pagination
   ?page=2&limit=20&fromDate=2024-01-01&toDate=2024-01-31

3. Sans dates (toutes les txs)
   ?page=1&limit=10
```

---

## Q6 : Profile vs Accounts — ce ne sont pas corrélés ?

**Réponse :** Non, ce ne sont PAS corrélés directement.

```
Profile = Personne (firstName, lastName, email)
Accounts = Comptes bancaires (je peux en avoir plusieurs)

Un utilisateur → Beaucoup de comptes → Beaucoup de txs
      1                   N               N

Mais TOUT est lié par le token + vérifications backend
```

**Comment ça marche :**

```python
# Backend
User (via token) 
  ↓
  Account.find({ userId: JWT.id })  ← Récupère TOUS les comptes de cet utilisateur
  ↓
  Transaction.find({ accountId: accountID })  ← Récupère toutes les txs de ce compte
```

**Verrous de sécurité :**
1. ✅ Token valide ?
2. ✅ UserID extrait du token ?
3. ✅ Les comptes appartiennent à cet utilisateur ?
4. ✅ Les txs appartiennent à ce compte ?

Si une seule vérif échoue → 401/403 Unauthorized

---

## Q7 : V2 c'est un autre serveur ?

**Réponse :** NON. V1/V2 c'est juste du **versioning sur le même serveur**.

```
localhost:3001 (un seul serveur)
├─ /api/v1/...  (endpoints v1)
└─ /api/v2/...  (endpoints v2)

Raison du versioning :
- Compatibilité ascendante
- Évolution indépendante (v1 clients vs v2 clients)
- Dépréciation progressive (6 mois avant shutdown)
```

---

<a name="checklist"></a>
# ✅ Checklist Implémentation Backend

## Phase 1 (Actuellement ✅)
- ✅ POST /v1/user/login
- ✅ POST /v1/user/signup
- ✅ POST /v1/user/profile (GET)
- ✅ PUT /v1/user/profile (UPDATE)

## Phase 2 (À implémenter 📅)

### Modèles Mongoose
- [ ] Account Model
  - [ ] Field: userId (ObjectId ref User)
  - [ ] Field: accountName
  - [ ] Field: amount
  - [ ] Field: currency
  - [ ] Index: (userId) pour requêtes rapides

- [ ] Transaction Model
  - [ ] Field: accountId (ObjectId ref Account)
  - [ ] Field: date
  - [ ] Field: description
  - [ ] Field: amount
  - [ ] Field: balance
  - [ ] Field: category (optional)
  - [ ] Field: note (optional)
  - [ ] Index: (accountId, date) pour requêtes por plages

### Routes & Controllers
- [ ] GET /v1/user/accounts
  - Middleware: validateToken
  - Logic: Account.find({ userId: token.id })
  - Security: Vérifier token valide

- [ ] GET /v2/transactions/{accountID}
  - Middleware: validateToken
  - Parameters: page (1), limit (10), fromDate, toDate
  - Query: Transaction.find({ accountId, date: { $gte, $lte } })
  - Pagination: .skip().limit()
  - Security: Vérifier user possède ce compte

- [ ] GET /v2/transactions/account/{transactionID}
  - Middleware: validateToken
  - Retour: One transaction complete
  - Security: Vérifier user possède le compte de cette txn

- [ ] PUT /v2/transactions/account/{transactionID}
  - Middleware: validateToken
  - Body: { category (id), note }
  - Update: Transaction.findByIdAndUpdate()
  - Security: Vérifier user possède le compte de cette txn

- [ ] GET /v2/categories
  - Middleware: validateToken
  - Retour: [{id, label}] — liste managée côté serveur
  - Permet au frontend de peupler le dropdown sans liste statique

### Sécurité
- [ ] Middleware de validation token sur TOUS les endpoints v1/v2 (sauf login/signup)
- [ ] Vérification userId == token.id sur Account.find()
- [ ] Double vérification: user possède ce compte avant retourner txs
- [ ] Tester accès croisé (John ne peut pas voir comptes de Marie)

### Tests
- [ ] Postman/Insomnia pour chaque endpoint
- [ ] Cas de succès (200)
- [ ] Cas d'erreur (400, 401, 403, 404)
- [ ] Tests d'accès non autorisé
- [ ] Pagination: teste page 1, page max, page invalide
- [ ] Date filters: teste dates valides, inverses, manquantes

### Performance
- [ ] Index MongoDB sur (userId) pour Account
- [ ] Index sur (accountId, date) pour Transaction
- [ ] Teste avec 10 000+ transactions
- [ ] Teste pagination avec gros datasets

## Phase 3 (Optionnel 🎁)
- [ ] DELETE /v2/transactions/account/{transactionID} (supprimer annotation ?)
- [ ] GET /v2/accounts/{accountID}/summary (résumé mois/année)
- [ ] POST /v2/transactions/bulk (import transactions)
- [ ] GET /v2/statistics (dashboard données)

---

# 🚀 Démarrage

## Installation

```bash
# Cloner le backend
git clone <backend-repo>
cd backend

# Installer dépendances
npm install

# Configuration .env
PORT=3001
MONGO_URI=mongodb://localhost:27017/argentbank
SECRET_KEY=your-super-secret-key

# Démarrer
npm run dev

# L'API est à http://localhost:3001
# Swagger : http://localhost:3001/api-docs (si implémenté)
```

## Tester rapidement

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bank.com","password":"password123"}'

# 2. Copier le token reçu, puis :
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 3. Récupérer profil
curl -X POST http://localhost:3001/api/v1/user/profile \
  -H "Authorization: Bearer $TOKEN"

# 4. Récupérer comptes (une fois implémenté)
curl -X GET http://localhost:3001/api/v1/user/accounts \
  -H "Authorization: Bearer $TOKEN"
```

---

# 📝 Notes Finales

## Points Clés À Retenir

1. **Un serveur, deux versions** : localhost:3001 = /api/v1 + /api/v2
2. **Token = Clé d'accès** : Utilisé pour chaque requête v1/v2
3. **Data corrélées** : User → Accounts → Transactions (via userId, accountId)
4. **Sécurité multi-niveaux** : Token + vérification user + vérification ownership
5. **Pagination obligatoire** : Par défaut page=1, limit=10
6. **Dates optionnelles** : fromDate/toDate pour filtrer période

## Justifications des Choix Architecturaux

| Choix | Justification |
|-------|---------------|
| **`GET /v2/categories` — endpoint dédié** | Gérer les catégories côté serveur évite tout redéploiement frontend si la liste évolue. Scalable et modulable. |
| **Versioning `/v1` vs `/v2`** | Les routes d'auth restent en v1 pour ne pas casser l'existant. Les nouvelles features transactions partent en v2 (backward compatibility). |
| **`GET /v1/user/accounts` — route dédiée** | Le frontend a besoin des `accountID` pour construire les appels transactions. Séparé du profil car ce ne sont pas les mêmes données. |
| **Pagination `page` + `limit`** | On ne peut pas retourner toutes les transactions sans limite (performance). Défaut : 10 par page. La réponse inclut `totalPages` pour permettre la navigation. |
| **Filtrage `fromDate` / `toDate`** | Répond directement au besoin "mois en cours" du cahier des charges. Paramètres optionnels pour ne pas forcer un filtre systématique. |
| **PUT avec `category` + `note` ensemble** | Les deux champs sont éditables sur la même vue. Un seul appel API évite deux requêtes réseau pour une seule action utilisateur. |
| **`category` stockée comme `id` (pas `label`)** | Envoyer l'`id` garantit la stabilité de la référence même si le libellé affiché change côté back. |

## Questions Ouvertes (À Décider)

- [ ] Peut-on supprimer les annotations (note/category) ?
- [ ] Archive transactions ou garder indéfiniment ?
- [ ] Soft delete ou hard delete pour comptes ?
- [ ] Roles/Permissions futurs (admin, viewer, editor) ?

## Documents de Référence

- `swagger.yaml` → Documentation API complète
- `API_JUSTIFICATIONS.md` → Justifications architecturales
- Ce fichier → Guide d'implémentation

---

**🎉 Fin du guide. Bon backend ! 🚀**

