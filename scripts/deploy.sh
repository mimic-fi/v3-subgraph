#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Run graph build
yarn build:$NETWORK

# Require $GRAPH_KEY to be set
if [[ -z "${GRAPH_KEY}" ]]; then
  echo "Please set \$GRAPH_KEY to your The Graph deploy key to run this command."
  exit 1
fi

# Deploy subgraph
graph deploy mimic-fi/v3-$NETWORK --product hosted-service --access-token "$GRAPH_KEY"
