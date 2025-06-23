# Node version
FROM node:24-alpine

# Root directory in Docker 
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Backend port
EXPOSE 3000

# Start the backend server
CMD ["npm", "start"]
