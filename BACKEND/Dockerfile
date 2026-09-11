FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY app.js ./app.js
COPY src ./src
COPY docker-start.js ./docker-start.js

EXPOSE 3000

CMD ["node", "docker-start.js"]
