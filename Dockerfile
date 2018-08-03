FROM node:8.11-alpine

# Create app directory
RUN mkdir -p /usr/src/app/src
WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache git

# Copy required project files
COPY package.json yarn.lock .env.example ./
COPY src/ ./src/

# Install app dependencies first (cache as docker layer)
RUN yarn --frozen-lockfile --production

EXPOSE 3000
CMD [ "yarn", "start" ]
