# Create image 
FROM node:24.2.0

# directory
WORKDIR /app

# copy package files
COPY package.json package-lock.json ./

# install dependency
RUN npm install

# start server
CMD ["npm", "run", "dev"]