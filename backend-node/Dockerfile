# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and prisma schema
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY . .

# Generate prisma client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create app user
RUN addgroup -S app && adduser -S app -G app

# Copy only runtime artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Files permissions
RUN chown -R app:app /app
USER app

EXPOSE 4000

# Do NOT run migrations automatically here in production.
# Run migrations as part of deployment pipeline or a dedicated job:
#   npx prisma migrate deploy --schema=./prisma/schema.prisma
CMD ["node", "dist/src/index.js"]
