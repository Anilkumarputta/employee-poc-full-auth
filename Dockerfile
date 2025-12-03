# Root Dockerfile - Backend by default
FROM node:18-alpine

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

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
