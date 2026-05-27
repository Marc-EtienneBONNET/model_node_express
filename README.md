# model_node_express

**Template back Node.js + Express** sur lequel toutes mes APIs sont construites. Le repo expose un serveur Express en TypeScript strict, branché sur Postgres via Prisma, avec Socket.io pour le temps réel, un système d'i18n custom (30 locales), une gestion d'erreur typée et localisée, et un pipeline lint/format/build prêt à l'emploi.

Conçu pour se brancher directement sur le template [`model_db_postgres`](../model_db_postgres) (même `DATABASE_URL` par défaut) et pour servir d'API au template [`model-react-native`](../model-react-native).

---

## Sommaire

1. [Stack technique](#stack-technique)
2. [Démarrage](#démarrage)
3. [Structure du projet](#structure-du-projet)
4. [Bootstrap du serveur](#bootstrap-du-serveur)
5. [API REST](#api-rest)
6. [WebSocket (Socket.io)](#websocket-socketio)
7. [Middlewares](#middlewares)
8. [Prisma & base de données](#prisma--base-de-données)
9. [Internationalisation (i18n)](#internationalisation-i18n)
10. [Gestion d'erreurs](#gestion-derreurs)
11. [Console colorée](#console-colorée)
12. [Variables d'environnement](#variables-denvironnement)
13. [Scripts npm](#scripts-npm)
14. [Configuration Biome](#configuration-biome)
15. [Configuration TypeScript](#configuration-typescript)
16. [Conventions de code](#conventions-de-code)

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| Node.js | ≥ 20 (ESM `NodeNext`) | Runtime |
| TypeScript | ~5.9 | Strict mode |
| Express | ^4.21 | HTTP framework |
| Prisma | ^7.8 | ORM Postgres (schéma + client typé) |
| `@prisma/adapter-pg` + `pg` | ^7.8 / ^8.21 | Adapter Postgres (driver natif `pg`) |
| Socket.io | ^4.8 | WebSocket / temps réel |
| Helmet | ^8.2 | Security headers |
| CORS | ^2.8 | Cross-Origin |
| dotenv | ^17.4 | Chargement `.env` |
| tsx | ^4.19 | Exécution TS en dev (sans build) |
| nodemon | ^3.1 | Watch + reload |
| Biome | ^2.3 | Lint + format (remplace ESLint + Prettier) |

---

## Démarrage

```bash
# 1. Installer les deps
npm install

# 2. Initialiser le .env (déjà commité ici)
cp .env.example .env       # adapter DATABASE_URL et CORS si besoin

# 3. Lancer la base (depuis ../model_db_postgres)
cd ../model_db_postgres && ./start && cd -

# 4. Démarrer le serveur en dev (auto-reload)
npm run dev
```

`npm run dev` enchaîne `prisma db push` (synchro du schéma vers la base) puis `nodemon` (watch `src/` + reload via `tsx`).

Le serveur écoute sur `http://localhost:3000` par défaut.

---

## Structure du projet

```
model_node_express/
├── src/
│   ├── index.ts                  # Entry point : Prisma connect → Express listen → Socket.io attach
│   ├── configExpress.ts          # Factory Express (middlewares + routes)
│   ├── configCors.ts             # Factory CORS (validation des origins whitelistées)
│   ├── configPrisma.ts           # Client Prisma + helpers connect/disconnect
│   ├── configSocket.ts           # Factory Socket.io (middlewares + handlers)
│   ├── api/
│   │   ├── routers/
│   │   │   ├── index.ts          # Router central (mount des sous-routers)
│   │   │   └── exemple.ts        # Exemple : CRUD sur /exemple
│   │   ├── controllers/
│   │   │   └── exempleController.ts
│   │   ├── services/
│   │   │   └── exempleService.ts
│   │   ├── middlewares/
│   │   │   └── configRequest.ts  # Parse Accept-Language + Authorization → req.config
│   │   ├── models/               # (placeholder)
│   │   └── socket/
│   │       └── index.ts          # registerSocket : déclare les handlers WS
│   ├── lib/
│   │   ├── console/
│   │   │   └── applyColors.ts    # Monkey-patch console.info (bleu) + console.error (rouge)
│   │   ├── customError/
│   │   │   └── classCustomError.ts  # Erreur typée + i18n + status HTTP
│   │   └── trad/                 # Système d'i18n maison (30 locales)
│   │       ├── hook/trad.ts
│   │       ├── class/classTranslation.ts
│   │       ├── enum/enumLocale.ts
│   │       ├── translations.ts
│   │       └── json/
│   │           ├── fr/           # Traductions FR (config, api, errorMachine)
│   │           └── en/           # Stubs EN
│   ├── types/
│   │   ├── request.ts            # Augmentation Express.Request (req.config)
│   │   └── socket.ts             # Types Socket.io (events + socket.data)
│   └── database/                 # (placeholder)
├── prisma/
│   └── schema.prisma             # Model: User { id, socketId? }
├── prisma.config.ts              # Loader prisma config (charge .env, force DATABASE_URL)
├── nodemon.json                  # Watch src/, ext ts/json, exec tsx
├── biome.jsonc
├── tsconfig.json                 # ES2022 + NodeNext + strict
├── .env                          # Variables locales (commité)
└── package.json
```

---

## Bootstrap du serveur

`src/index.ts` enchaîne dans cet ordre :

1. **`applyColors()`** — patche `console.info` (bleu) et `console.error` (rouge) via `util.styleText`.
2. **`connectPrisma()`** — ouvre la connexion Postgres.
3. **`createApp()`** — instancie Express avec tous les middlewares et le router racine.
4. **`app.listen(API_PORT)`** — démarre le serveur HTTP (port par défaut `3000`).
5. **`createSocketServer(httpServer)`** — attache Socket.io au serveur HTTP existant.
6. **Gestion des erreurs `listen`** : `EADDRINUSE`, `EACCES`, etc. sont catchées et reformulées via `ClassCustomError` (message traduit + status HTTP).

---

## API REST

Router central : **`src/api/routers/index.ts`**. Chaque sous-router est monté ici (actuellement : `/exemple`).

### Convention par feature

Pour chaque ressource, trois fichiers parallèles :

```
src/api/
├── routers/<feature>.ts          # définition des routes Express
├── controllers/<feature>Controller.ts   # parse req → appelle service → format response
└── services/<feature>Service.ts  # logique métier + Prisma
```

### Exemple : `/exemple`

| Méthode | Endpoint | Handler |
|---|---|---|
| GET | `/exemple` | `getOne` |
| POST | `/exemple` | `postOne` |
| PATCH | `/exemple` | `patchOne` |
| DELETE | `/exemple` | `deleteOne` |

Chaque controller :

- Destructure `params`, `body`, `query`, `req.config` (locale + token).
- Appelle la fonction de service correspondante (`findExempleById`, `createExemple`, etc.).
- Renvoie la réponse JSON avec le status HTTP approprié.

---

## WebSocket (Socket.io)

Configuré dans **`src/configSocket.ts`** et branché sur le serveur HTTP existant (pas de port séparé).

### CORS

Même whitelist que l'API REST (`CORS_ALLOWED_ORIGINS`).

### Middleware de handshake

Extrait deux infos de la connexion entrante :

- **`locale`** depuis l'header `Accept-Language` ou `socket.handshake.auth.locale`.
- **`tokenConnection`** depuis l'header `Authorization: Bearer …` ou `socket.handshake.auth.token`.

Ces deux valeurs sont posées sur **`socket.data.config`** et accessibles dans tous les handlers.

### Handler exemple

`src/api/socket/index.ts` → `registerSocket()` :

- Listener `ping` → renvoie `pong`.

Ajouter un événement = ajouter un `socket.on(...)` dans `registerSocket`. Les types des events (`ClientToServerEvents`, `ServerToClientEvents`) sont définis dans `src/types/socket.ts` et étendables au besoin.

---

## Middlewares

Stack appliqué par `createApp()` (`configExpress.ts`), dans l'ordre :

1. **`helmet()`** — security headers (CSP, X-Frame-Options, etc.).
2. **CORS** (`configCors.ts`) — whitelist par origin avec validation du scheme (`http://` ou `https://`). Si `CORS_ALLOWED_ORIGINS` vide → tout autorisé (dev).
3. **`express.json({ limit: "100kb" })`** — body parser JSON, limite 100 kB.
4. **`configRequest`** — parse `Accept-Language` + `Authorization` et pose `req.config = { locale?, tokenConnection? }`.
5. **Router applicatif** (`src/api/routers/index.ts`).
6. **Error handler global** — catche les `ClassCustomError` et renvoie `{ message, status }` en JSON.

### `req.config`

Augmentation Express.Request typée dans `src/types/request.ts` :

```ts
declare namespace Express {
  interface Request {
    config?: {
      locale?: EnumLocale;
      tokenConnection?: string;
    };
  }
}
```

Disponible dans tous les controllers : `req.config?.locale`, `req.config?.tokenConnection`.

---

## Prisma & base de données

### Provider

PostgreSQL, via `@prisma/adapter-pg` + `pg` (driver natif). C'est l'approche **adapter-based** de Prisma 7, plus légère que le binaire historique.

### Configuration

**`prisma.config.ts`** charge `.env` (dotenv) et vérifie la présence de `DATABASE_URL` (throw si manquante). Pointe vers `prisma/schema.prisma`.

### Schéma actuel

```prisma
model User {
  id       String  @id @default(cuid())
  socketId String?
}
```

Modèle minimaliste — placeholder à étendre selon le projet.

### Synchronisation

Pas de migrations — le template utilise **`prisma db push`** (lancé automatiquement par `npm run dev` et `npm start`) pour synchroniser le schéma sur la base. Pour les projets sérieux, basculer sur `prisma migrate` (créer un dossier `prisma/migrations/`).

### Client

`src/configPrisma.ts` exporte un singleton `prisma` (instancié avec l'adapter Postgres) et deux helpers `connectPrisma()` / `disconnectPrisma()`.

---

## Internationalisation (i18n)

Système **fait main**. Pas de dépendance externe.

### Locales supportées

`EnumLocale` (`src/lib/trad/enum/enumLocale.ts`) liste **30 langues** : `fr`, `en`, `es`, `de`, `it`, `pt`, `nl`, `pl`, `ru`, `ja`, `zh`, `ko`, `ar`, `tr`, `sv`, `da`, `no`, `fi`, `cs`, `el`, `he`, `hi`, `th`, `vi`, `id`, `uk`, `ro`, `hu`, …

### Locale par défaut

Lue depuis la variable `DEFAULT_LANGAGE` (défaut `fr`). Doit correspondre à une valeur de `EnumLocale`.

### Architecture

`src/lib/trad/`
- **`hook/trad.ts`** — fonction `trad(key, file, locale?, args?)`.
- **`class/classTranslation.ts`** — gère le lookup par fichier/clé et l'interpolation.
- **`translations.ts`** — registry global des fichiers JSON chargés.
- **`json/<locale>/<feature>/<file>.json`** — un fichier par feature/namespace (`config/info`, `api/exemple`, `errorMachine/listen`, etc.).

### Usage

```ts
import { trad } from "@/lib/trad/hook/trad";

const message = trad("info.listening", "config", "fr", { url: "http://localhost:3000" });
// → "Serveur démarré sur http://localhost:3000"
```

Interpolation via `{paramName}` (accolades simples).

### Ajouter une langue

1. Créer le dossier `src/lib/trad/json/<locale>/`.
2. Copier la structure FR (`config/`, `api/`, `errorMachine/`).
3. Traduire chaque clé.
4. Importer les nouveaux JSON dans `src/lib/trad/translations.ts`.

---

## Gestion d'erreurs

### `ClassCustomError`

`src/lib/customError/classCustomError.ts` — erreur typée centrale du projet :

```ts
throw new ClassCustomError({
  file: "errorMachine/listen",
  key: "eaddrinuse",
  args: { port: 3000 },
  status: 500,
  cause: originalError,
});
```

Comportement :

- Le **message** est résolu via le système i18n (clé + fichier → traduction dans la locale courante).
- Le **status HTTP** par défaut est `500`, override possible.
- Les **args** sont interpolés dans le message.
- La **stack trace** est capturée.
- Le **cause** (erreur d'origine) est préservé pour debugger.
- À la création, l'erreur est **loggée en rouge** dans la console.

### Error handler global

Posé en dernier middleware Express : catche les `ClassCustomError`, renvoie `{ message, status }` en JSON avec le bon `res.status()`, et laisse passer les autres erreurs vers le handler par défaut d'Express.

---

## Console colorée

`src/lib/console/applyColors.ts` monkey-patch deux méthodes natives au boot :

| Méthode | Couleur | Usage |
|---|---|---|
| `console.info` | Bleu | Démarrage serveur, lifecycle |
| `console.error` | Rouge | Erreurs (auto-utilisé par `ClassCustomError`) |

Implémentation via `util.styleText()` (API native Node 22+). Aucun package coloriste externe.

---

## Variables d'environnement

### `.env`

| Variable | Rôle | Défaut |
|---|---|---|
| `DATABASE_URL` | Connexion Postgres (Prisma) | `postgresql://user:pass@localhost:9000/db?schema=public` |
| `API_PORT` | Port HTTP du serveur Express | `3000` |
| `DEFAULT_LANGAGE` | Locale par défaut (clé `EnumLocale`) | `fr` |
| `CORS_ALLOWED_ORIGINS` | Whitelist d'origins, séparés par virgule | (vide = `*`) |

Exemple `CORS_ALLOWED_ORIGINS` :

```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:2000
```

`DATABASE_URL` est **obligatoire** — `prisma.config.ts` throw au démarrage si absente.

En prod, **toujours** spécifier une whitelist CORS (ne pas laisser vide).

---

## Scripts npm

| Script | Action |
|---|---|
| `npm run dev` | `prisma db push && nodemon` — synchro DB puis démarrage avec watch. |
| `npm run build` | `tsc` — compile en `dist/`. |
| `npm start` | `prisma db push && node --env-file=.env dist/index.js` — exécution prod. |
| `npm run typecheck` | `tsc --noEmit` — vérification de types sans build. |
| `npm run lint` | `biome check --write` — lint + autofix. |
| `npm run lint:fix` | `biome format --write` — format only. |
| `npm run lint:check` | `biome check` — lecture seule (CI). |

---

## Configuration Biome

`biome.jsonc` :

- **Indent** : tab (largeur 2)
- **Line width** : 80
- **Scope** : `src/**/*.ts` uniquement
- **VCS** : désactivé (pas de respect du `.gitignore` Biome)
- **Linter** :
  - `recommended` : on
  - `useNodejsImportProtocol` : error (oblige `node:fs` au lieu de `fs`)
  - `useImportType` : error (oblige `import type {}`)
  - `noExplicitAny` : error
  - `noUnusedVariables` : error
  - `noUnusedImports` : error (safe fix)
- **Assist** : organize imports auto

---

## Configuration TypeScript

`tsconfig.json` :

| Option | Valeur | Note |
|---|---|---|
| `target` | `ES2022` | Compatible Node ≥ 20 |
| `module` | `NodeNext` | ESM natif (imports avec extension `.js`) |
| `moduleResolution` | `NodeNext` | — |
| `strict` | `true` | Tous les flags strict activés |
| `esModuleInterop` | `true` | Pour les imports CJS legacy |
| `resolveJsonModule` | `true` | Import direct de JSON (i18n) |
| `forceConsistentCasingInFileNames` | `true` | Sécurité macOS / Linux |
| `sourceMap` | `true` | Stack trace lisible côté dev |
| `rootDir` | `src/` | — |
| `outDir` | `dist/` | — |

⚠️ **ESM** : tous les imports relatifs doivent inclure l'extension `.js` même dans les fichiers `.ts` (`import { foo } from "./foo.js"`).

---

## Conventions de code

Détaillées dans `~/.claude/rules/` (TypeScript, etc.). Résumé :

- **TypeScript strict**, pas d'`any`.
- **Fichiers en camelCase** (première lettre minuscule).
- **Un fichier = un seul export principal**.
- **Named exports** (pas de `export default`).
- **Variables / fonctions** : `camelCase`.
- **Types** : `PascalCase` préfixé `Type` (ex. `TypeExempleRequest`).
- **Interfaces** : `PascalCase` préfixé `Inter`.
- **Enums** : `PascalCase` préfixé `Enum` (ex. `EnumLocale`). Toujours préférer un enum à une union de strings.
- **Classes** : `PascalCase` préfixée `Class` (ex. `ClassCustomError`, `ClassTranslation`).
- **Fonctions nommées** (`function foo() {}`) en top-level, arrow function uniquement en callback inline.
- **Pattern routers → controllers → services** strict (pas de Prisma dans les controllers, pas de `req`/`res` dans les services).

Lint/format : **Biome** (`npm run lint`). Tab pour l'indentation, ligne 80 max.
