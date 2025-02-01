# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./dist/server.js
COPY --from=builder /app/routes ./dist/routes
COPY --from=builder /app/db.js ./dist/db.js
# COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]