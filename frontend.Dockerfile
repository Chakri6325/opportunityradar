# Frontend Dockerfile for Next.js (frontend/)
# Used by docker-compose.yml (dockerfile: frontend.Dockerfile, context: .)

FROM node:20-alpine AS deps
WORKDIR /app

# Install deps using package.json from frontend/
COPY frontend/package.json ./frontend/package.json
# package-lock.json is optional; repo may not include it
RUN cd frontend && npm install --legacy-peer-deps


FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend

# Ensure PostCSS config is present for Tailwind processing
RUN ls frontend/postcss.config.js || echo "WARNING: postcss.config.js missing!"

# Next.js build (keeps it production-ready)
RUN cd frontend && npm run build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules from builder (avoids re-install in runner)
COPY --from=builder /app/frontend/node_modules ./node_modules
# Copy build artifacts
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/next.config.js ./next.config.js

# public/ folder doesn't exist in this project; create empty one for Next.js
RUN mkdir -p ./public

EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
