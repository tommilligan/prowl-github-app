#!/bin/sh
set -ev

# Version tag has no 'v' prefix on docker
VERSION="printf \"${TRAVIS_TAG}\" | sed 's/^v//'"
IMAGE_TAG="tommilligan/prowl-github-app:${VERSION}"

# Build image
docker build -t $IMAGE_TAG .

# Push to DockerHub
docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD"
docker push $IMAGE_TAG

