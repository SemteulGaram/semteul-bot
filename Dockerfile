# Environment
FROM node:16.13.0-alpine3.14 as builder
WORKDIR /app

# Dependency
COPY package*.json ./
RUN npm install

# Build
COPY . .
RUN npm run build && npm prune --production

# Final Image
FROM node:16.13.0-alpine3.14 as final
WORKDIR /app

# Copying build output
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist/ dist
COPY --from=builder /app/node_modules/ node_modules

# Copying required resources
COPY external external

# Copying secret resources
COPY secret secret
COPY .env* ./

# Ready
CMD ["npm", "start"]
