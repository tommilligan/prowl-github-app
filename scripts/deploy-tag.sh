#!/bin/sh
set -ev

# Login to DockerHub
docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD"

# Version tag has no 'v' prefix on docker
VERSION=$(printf ${TRAVIS_TAG} | sed 's/^v//')
IMAGE_TAG="tommilligan/prowl-github-app:${VERSION}"

# Build image
docker build -t "${IMAGE_TAG}" .
docker push $IMAGE_TAG

# Build -cr image (amended logging)
IMAGE_TAG="${IMAGE_TAG}-cr"
docker build -t "${IMAGE_TAG}" --file Dockerfile-cr --build-arg VERSION=$VERSION .
docker push $IMAGE_TAG

