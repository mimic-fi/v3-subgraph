#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Run graph build
yarn build:$NETWORK

# Studio deployments
platform_base=studio
platform_zkevm=studio

# Load platform
if [[ -z $PLATFORM ]]; then
  PLATFORM_VAR=platform_$NETWORK
  PLATFORM=${!PLATFORM_VAR}
fi

# Deploy subgraph
if [ "$PLATFORM" == "studio" ]; then
    echo "Deploying $NETWORK to subgraph studio"
    if [[ -z $VERSION_LABEL ]]; then
      echo 'Please make sure a version label is provided'
      exit 1
    fi
    yarn graph deploy mimic-v3-$NETWORK --studio --deploy-key $GRAPH_KEY -l $VERSION_LABEL
else
    echo "Deploying $NETWORK to hosted service"
    yarn graph deploy mimic-fi/v3-$NETWORK --product hosted-service --deploy-key $GRAPH_KEY
fi

# Check deployer status
if [ $? -ne 0 ]; then
    echo "Error trying to deploy subgraph with exit status $?"
    echo "$output"
    exit $?
fi
