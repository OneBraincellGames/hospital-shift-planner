#!/bin/sh
set -e

echo "▶ Running database migrations..."
# NODE_PATH lets jiti resolve prisma/config and its deps (effect, etc.)
# from the self-contained prisma-cli tree when loading prisma.config.ts
NODE_PATH=/app/prisma-cli/node_modules \
  node prisma-cli/node_modules/prisma/build/index.js migrate deploy

echo "▶ Starting application..."
exec node server.js
