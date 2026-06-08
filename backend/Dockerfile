# ── Stage 1 : builder ──────────────────────────────────────────────────────────
# Installe les outils de compilation nécessaires à better-sqlite3 (module natif C++),
# build le TypeScript en JavaScript, puis supprime les devDependencies.
FROM node:22-slim AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier package.json en premier : Docker met cette couche en cache.
# Si le code source change mais pas les dépendances, npm ci est sauté → rebuild rapide.
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Supprimer les devDependencies avant de copier node_modules en stage 2.
RUN npm prune --omit=dev

# ── Stage 2 : production ────────────────────────────────────────────────────────
# Image finale : uniquement le code compilé + les dépendances de prod.
# Même base (node:22-slim / glibc) que le builder → le binaire better-sqlite3.node est compatible.
FROM node:22-slim AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Créer les dossiers attendus par configuration.ts.
# Ils seront montés en volume par docker-compose — le dossier doit exister avant le montage.
RUN mkdir -p /app/data/images /app/static

ENV NODE_ENV=production

EXPOSE 4005

CMD ["node", "dist/main"]
