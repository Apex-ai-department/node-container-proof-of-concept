# Create image 
FROM node:24-alpine

# directory
WORKDIR /app

# copy package files
COPY package.json package-lock.json ./

# install dependency
RUN npm install

# copy source file
COPY . .

# expose port
EXPOSE 5173

# start server
CMD ["npm", "run", "dev"]