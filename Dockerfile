FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies for client
RUN npm install

# Install dependencies for server
WORKDIR /app/server
RUN npm install

WORKDIR /app

COPY . .

# Build the client
RUN npm run build

EXPOSE 3002 5001

CMD ["npm", "run", "dev"]
