# Root Dockerfile - Backend by default
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy backend files
COPY backend-node/package*.json ./
COPY backend-node/prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy backend source
COPY backend-node ./

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start the application - use db push to sync schema without migrations
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm start"]
