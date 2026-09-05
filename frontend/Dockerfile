# ── Stage 1 : builder ──────────────────────────────────────────────────────────
# Build le projet React avec Vite. TypeScript est compilé + bundlé → frontend/dist/.
FROM node:22-slim AS builder

WORKDIR /app

# Même logique que le backend : package.json en premier pour exploiter le cache Docker.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2 : production ────────────────────────────────────────────────────────
# nginx:alpine est l'image standard pour servir des fichiers statiques.
# On y copie uniquement le résultat du build : pas node_modules, pas les sources.
FROM nginx:alpine AS production

# Copier le build React dans le dossier servi par nginx par défaut.
COPY --from=builder /app/dist /usr/share/nginx/html

# Remplacer la config nginx par défaut par la nôtre (SPA routing + proxy /api et /media).
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
