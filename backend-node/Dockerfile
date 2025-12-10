# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci


# Copy source code except node_modules and dist
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Ensure dist folder is present
RUN ls -l dist || echo "dist folder missing!"
# Expose port
EXPOSE 4000

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
