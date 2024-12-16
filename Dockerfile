FROM node:22-alpine

# Needs for health check
RUN apk add curl

ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_OPTIONS --no-deprecation

RUN npm config set update-notifier false

WORKDIR /app
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json
COPY next.config.js ./next.config.js
COPY prisma ./prisma
COPY graphql/templates /app/graphql/templates
COPY .next ./.next
COPY .env ./.env
COPY .npmrc ./.npmrc

RUN npm ci && npm prune --production

EXPOSE 3000
ENV NODE_ENV production

CMD ["npm", "start"]
