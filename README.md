# SNDE — Suivi des Versements Bancaires

Application de saisie et suivi des versements bancaires des centres SNDE.  
Stack : **FastAPI + React + PostgreSQL (Neon)** — déployée sur **Vercel**.

---

## Mise en place rapide

### 1. Créer la base de données

1. Aller sur [neon.tech](https://neon.tech) → créer un compte gratuit → créer un projet
2. Copier la chaîne de connexion (`postgresql://...`)
3. Ouvrir le **SQL Editor** de Neon
4. Coller et exécuter tout le contenu de `schema.sql`

### 2. Déployer sur Vercel

1. Mettre le projet sur GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Puis push vers un nouveau repo GitHub.

2. Aller sur [vercel.com](https://vercel.com) → importer le repo GitHub

3. Dans les **Environment Variables** de Vercel, ajouter :
   - `DATABASE_URL` = la chaîne de connexion Neon
   - `SECRET_KEY` = une clé aléatoire (ex: `openssl rand -hex 32`)

4. Déployer. L'URL obtenue est le lien à partager avec la DFC.

### 3. Connexion

- **Admin** : utilisateur `admin`, mot de passe `admin123` (changer après le premier login via la page Utilisateurs)
- **DFC** : créer les comptes depuis la page Utilisateurs (rôle "DFC")

---

## Développement local

```bash
# Frontend
npm install
npm run dev

# Backend
pip install -r requirements.txt
export DATABASE_URL="postgresql://..."
export SECRET_KEY="dev-key"
uvicorn api.index:app --reload --port 8000
```

Le proxy Vite redirige `/api/*` vers le backend sur le port 8000.

---

## Structure

```
api/index.py          → Backend FastAPI (fonctions serverless Vercel)
src/                  → Frontend React (Vite)
  pages/Login.jsx     → Page de connexion
  pages/Saisie.jsx    → Formulaire de saisie (DFC)
  pages/Admin.jsx     → Vue des versements + stats (Admin)
  pages/Users.jsx     → Gestion des utilisateurs (Admin)
schema.sql            → Schéma de la base + liste des centres
vercel.json           → Configuration Vercel
```
