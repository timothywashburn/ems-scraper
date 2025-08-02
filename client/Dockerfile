# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy types package first
COPY ../types-package/ types-package/
WORKDIR /app/types-package
RUN npm ci && npm run build

# Copy client and build
WORKDIR /app
COPY . client/
WORKDIR /app/client
RUN npm install --ignore-scripts
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80