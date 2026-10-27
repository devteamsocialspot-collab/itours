# builder: compile TS
FROM node:24-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm@11
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY index.ts ./
COPY src ./src
RUN pnpm build

# runner: prod deps only
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm i -g pnpm@11
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
