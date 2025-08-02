# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy client and build
COPY . .
RUN npm install --ignore-scripts
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80