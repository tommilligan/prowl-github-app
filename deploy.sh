#!/bin/sh
set -ev

# Build image
docker build -t app .

# Push to DockerHub
docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD"
docker tag app tommilligan/prowl-github-app
docker push tommilligan/prowl-github-app

# Deploy to Heroku
heroku update
heroku container:login
docker tag app registry.heroku.com/prowl-github-app/web
docker push registry.heroku.com/prowl-github-app/web
heroku container:release -a prowl-github-app web

