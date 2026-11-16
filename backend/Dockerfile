# Stage 1: Build TypeScript & Prisma Client
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --workspace=backend

COPY backend ./backend

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime
FROM node:22-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm ci --omit=dev --workspace=backend

# Includes compiled Prisma Client (dist/generated/prisma) generated & built in builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/src/data ./backend/dist/data
COPY docs/openapi.yaml ./docs/openapi.yaml

RUN chown -R node:node /app

WORKDIR /app/backend
ENV NODE_ENV=production
EXPOSE 5000

USER node

CMD ["node", "dist/server.js"]
