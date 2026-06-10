# Backend Dockerfile for Node.js/TypeScript Express (backend/)
# Used by docker-compose.yml (dockerfile: backend.Dockerfile, context: .)

FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies from backend/package.json
COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --legacy-peer-deps


FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Compile TypeScript -> dist/
RUN cd backend && npm run build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy compiled output and production deps
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 5000
CMD ["node", "dist/server.js"]
