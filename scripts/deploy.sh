#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Run graph build
yarn build:$NETWORK

# Check deployment version
if [[ -z $VERSION_LABEL ]]; then
  echo 'Please make sure a version label is provided'
  exit 1
fi

# Define subgraph name
if [[ "$NETWORK" = "base" || "$NETWORK" = "zkevm" ]]; then
  NAME=mimic-v3-$NETWORK
else
  NAME=v3-$NETWORK
fi

# Deploy subgraph
echo "Deploying $NAME to subgraph studio"
yarn graph deploy $NAME --studio --deploy-key $GRAPH_KEY -l $VERSION_LABEL

# Check deployer status
if [ $? -ne 0 ]; then
  echo "Error trying to deploy subgraph with exit status $?"
  echo "$output"
  exit $?
fi
