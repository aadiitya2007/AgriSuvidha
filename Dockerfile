# Multi-stage Dockerfile for AgriSuvidha Full-Stack Platform

# Stage 1: Build Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --silent
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma ./prisma/
RUN npm ci --silent
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy server artifacts
COPY server/package*.json ./
RUN npm ci --only=production --silent
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma ./node_modules/@prisma

# Copy client build to static folder served by Express
COPY --from=client-builder /app/client/dist ./public

EXPOSE 5001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
