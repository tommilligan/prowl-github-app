#!/bin/sh
set -ev

VERSION="1.1.0"
IMAGE_TAG="tommilligan/prowl-github-app:1.1.0"

# Build -cr image (amended logging)
IMAGE_TAG="${IMAGE_TAG}-cr"
docker build -t "${IMAGE_TAG}" --file Dockerfile-cr --build-arg VERSION=$VERSION .

