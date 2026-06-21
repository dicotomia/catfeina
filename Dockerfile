FROM node:22-alpine
WORKDIR /usr/src/app
COPY server/package*.json ./server/
WORKDIR /usr/src/app/server
RUN npm install --omit=dev
WORKDIR /usr/src/app
COPY . .
EXPOSE 3000
WORKDIR /usr/src/app/server
CMD [ "node", "index.js" ]
