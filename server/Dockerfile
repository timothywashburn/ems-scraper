FROM node:18-alpine
WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build
EXPOSE 3100
CMD ["npm", "start"]