# Guide de déploiement - RICE COOKER

## Déploiement sur Vercel (Recommandé)

Vercel est la plateforme la plus simple pour déployer une application Next.js.

### Option 1 : Déploiement via l'interface Vercel (le plus simple)

1. **Créer un compte sur Vercel** : https://vercel.com/signup

2. **Pousser votre code sur GitHub** (si ce n'est pas déjà fait) :
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Importer le projet sur Vercel** :
   - Allez sur https://vercel.com/new
   - Connectez votre compte GitHub
   - Sélectionnez le repository `rice-cooker`
   - Vercel détectera automatiquement Next.js
   - Cliquez sur "Deploy"

4. **Configuration** :
   - Framework Preset : Next.js (détecté automatiquement)
   - Build Command : `npm run build` (par défaut)
   - Output Directory : `.next` (par défaut)
   - Install Command : `npm install` (par défaut)

5. **Déploiement** :
   - Vercel va automatiquement déployer votre application
   - Vous recevrez une URL du type : `https://rice-cooker-xxx.vercel.app`

### Option 2 : Déploiement via CLI Vercel

1. **Installer Vercel CLI** :
   ```bash
   npm i -g vercel
   ```

2. **Se connecter** :
   ```bash
   vercel login
   ```

3. **Déployer** :
   ```bash
   cd "/Users/paulbalmet/Desktop/Spirale/Clients/Guess the book/rice-cooker"
   vercel
   ```

4. **Suivre les instructions** :
   - Choisir le scope (votre compte)
   - Lier à un projet existant ou créer un nouveau projet
   - Confirmer les paramètres

### Configuration requise

Aucune configuration spéciale n'est nécessaire. Vercel détectera automatiquement :
- Next.js 16
- TypeScript
- Tailwind CSS

### Variables d'environnement

Aucune variable d'environnement n'est nécessaire pour le moment.

### Après le déploiement

- Votre application sera accessible sur une URL Vercel
- Les mises à jour seront automatiquement déployées à chaque push sur `main`
- Vous pouvez configurer un domaine personnalisé dans les paramètres Vercel

## Autres options d'hébergement

### Netlify
- Similaire à Vercel
- Supporte Next.js
- https://www.netlify.com/

### Railway
- Simple et rapide
- https://railway.app/

### Render
- Alternative à Vercel
- https://render.com/
