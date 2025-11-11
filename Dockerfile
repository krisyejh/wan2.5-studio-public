# Multi-stage build for optimized production image

# Stage 1: Build the frontend application
FROM docker.m.daocloud.io/node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build

# Stage 2: Production image with Node.js and Nginx
FROM docker.m.daocloud.io/node:20-alpine

# Install nginx for serving static files
RUN apk add --no-cache nginx

# Set working directory for backend
WORKDIR /app

# Copy backend server files and dependencies
COPY package*.json ./
COPY server.cjs ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create temp directory for file uploads
RUN mkdir -p /app/tmp

# Create startup script to run both services
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting WanStudio services..."' >> /start.sh && \
    echo 'echo "🚀 Starting Node.js backend..."' >> /start.sh && \
    echo 'node server.cjs &' >> /start.sh && \
    echo 'BACKEND_PID=$!' >> /start.sh && \
    echo 'echo "⏳ Waiting for backend to be ready..."' >> /start.sh && \
    echo 'sleep 3' >> /start.sh && \
    echo 'echo "✅ Starting Nginx..."' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Expose ports (80 for Nginx, 3001 for backend)
EXPOSE 80 3001

# Start both services using the startup script
CMD ["/start.sh"]
