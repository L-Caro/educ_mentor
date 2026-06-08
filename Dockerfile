# ── Stage 1 : build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Le build atterrit dans /app/backend/static (outDir de vite.config.ts)

# ── Stage 2 : build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
# Récupère le build frontend depuis le stage précédent
COPY --from=frontend-builder /app/backend/static ./static
RUN npm run build

# ── Stage 3 : image finale ────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Dépendances de production uniquement
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Artefacts buildés
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/static ./static

# Répertoire de données persisté via volume
RUN mkdir -p /app/data/images

EXPOSE 4005
CMD ["node", "dist/main.js"]
