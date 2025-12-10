# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci


# Copy source code explicitly

# Copy all backend files except node_modules and dist (handled by .dockerignore)
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Debug: print contents of dist folder
RUN echo "Contents of dist after build:" && ls -R dist

# Ensure dist/index.js is present
RUN ls -l dist && ls -l dist/index.js || (echo "dist/index.js missing!" && exit 1)
# Expose port
EXPOSE 4000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
