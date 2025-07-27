# Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies needed for building and Prisma
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the backend port
EXPOSE 7851

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Dependencies stage for production
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Builder stage for production
FROM base AS builder

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Generate Prisma client for production
RUN npx prisma generate

# Switch to non-root user
USER nodejs

# Expose the backend port
EXPOSE 7851

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:7851/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Start production server
CMD ["node", "dist/index.js"]