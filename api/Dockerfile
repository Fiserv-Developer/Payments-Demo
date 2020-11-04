# base image
FROM node:12.2.0-alpine

# Create app directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# install and cache app dependencies
COPY package.json /app/package.json
RUN npm install --silent
RUN npm install -g nodemon
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3124
ENV NODE_ENV=docker
CMD [  "nodemon", "server.js" ]

