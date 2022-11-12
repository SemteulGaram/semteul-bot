# Environment
FROM node:14
WORKDIR /usr/src/app

# Dependency
COPY package*.json ./
RUN npm install

# Build
COPY . .
RUN npm run build

# Ready
CMD ["npm", "start"]
