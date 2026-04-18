# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Build a standalone prisma-cli folder with all transitive deps
RUN mkdir /prisma-cli \
 && cd /prisma-cli \
 && npm init -y \
 && npm install --save-dev \
      prisma@$(node -e "console.log(require('/app/node_modules/prisma/package.json').version)") \
      dotenv \
 && rm -f package.json package-lock.json

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

# Prisma schema + migrations + config (needed at runtime for migrate deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma         ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Prisma generated client (query engine for the app)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma    ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma    ./node_modules/@prisma

# dotenv — needed so prisma.config.ts can be loaded by the Prisma CLI at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv     ./node_modules/dotenv

# Self-contained Prisma CLI (with all transitive deps) for migrate deploy
COPY --from=builder --chown=nextjs:nodejs /prisma-cli/node_modules     ./prisma-cli/node_modules

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
