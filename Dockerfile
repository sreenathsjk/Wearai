# Multi-stage build for WearAI production environment
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Build frontend assets compile and bundle sever.ts via esbuild
RUN npm run build

# Production runtime container
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only to minimize image footprint
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled outputs from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
