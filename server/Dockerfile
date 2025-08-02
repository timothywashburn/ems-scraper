FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3100
CMD ["npm", "start"]