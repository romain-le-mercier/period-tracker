# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies needed for building
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Development stage
FROM base AS development

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy application files
COPY . .

# Expose the frontend development port
EXPOSE 7850

# Start development server with hot reload
CMD ["npm", "start"]

# Dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Builder stage
FROM base AS builder

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
ENV REACT_APP_API_URL=/api
RUN npm run build

# Production stage using nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]