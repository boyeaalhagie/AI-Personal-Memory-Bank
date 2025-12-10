# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY frontend/ ./

# Build the application
# Environment variables for API URLs should be set at build time
ARG VITE_UPLOAD_SERVICE_URL
ARG VITE_EMOTION_SERVICE_URL
ARG VITE_TIMELINE_SERVICE_URL
ARG VITE_SEARCH_SERVICE_URL
ARG VITE_ADMIN_SERVICE_URL

ENV VITE_UPLOAD_SERVICE_URL=$VITE_UPLOAD_SERVICE_URL
ENV VITE_EMOTION_SERVICE_URL=$VITE_EMOTION_SERVICE_URL
ENV VITE_TIMELINE_SERVICE_URL=$VITE_TIMELINE_SERVICE_URL
ENV VITE_SEARCH_SERVICE_URL=$VITE_SEARCH_SERVICE_URL
ENV VITE_ADMIN_SERVICE_URL=$VITE_ADMIN_SERVICE_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

