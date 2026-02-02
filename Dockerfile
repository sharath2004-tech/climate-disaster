# Multi-stage build for React + Vite application
# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx (non-root compatible)
FROM nginx:alpine

# Create a non-root user and set up directories with proper permissions
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 && \
    mkdir -p /tmp/nginx /app && \
    chown -R appuser:appuser /tmp/nginx /app /usr/share/nginx/html && \
    chmod -R 755 /tmp/nginx

# Copy built assets from builder
COPY --from=builder /app/dist /app

# Create nginx config that works without root
RUN cat > /etc/nginx/nginx.conf <<EOF
pid /tmp/nginx/nginx.pid;
worker_processes auto;
error_log /dev/stderr info;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    access_log /dev/stdout;
    sendfile on;
    keepalive_timeout 65;
    gzip on;
    
    server {
        listen 10000;
        server_name _;
        
        root /app;
        index index.html;
        
        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # SPA routing - serve index.html for all routes
        location / {
            try_files \$uri \$uri/ /index.html;
        }
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Switch to non-root user
USER appuser

# Expose port 10000 (Render's default)
EXPOSE 10000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
