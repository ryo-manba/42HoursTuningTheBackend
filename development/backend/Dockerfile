FROM node:16-alpine
WORKDIR /backend
COPY src/ ./src
COPY package.json package-lock.json ./
RUN mkdir file
RUN mkdir file/static
ENV NODE_ENV=production
RUN npm ci

ENTRYPOINT ["node", "src/index.js"]
