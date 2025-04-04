# Environment
FROM node:22.14.0-alpine3.21 AS builder
WORKDIR /app

# Dependency
COPY package*.json ./
RUN npm i -g pnpm

# Build
COPY . .
RUN pnpm install && pnpm run build && pnpm prune --production

# Final Image
FROM node:22.14.0-alpine3.21 AS final
WORKDIR /app

# Copying build output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist/ dist
COPY --from=builder /app/node_modules/ node_modules

# Copying required resources
COPY external external

# Ready
CMD ["npm", "start"]
