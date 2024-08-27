FROM node:slim

WORKDIR /app

COPY package*.json .

RUN npm install

## IF PLAYWRIGHT IS TO BE RUN LOCALLY, RUN HERE: npx playwright install chromium

COPY . .

CMD node js/index.js