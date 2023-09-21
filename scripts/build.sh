#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Arbitrum
registry_arbitrum=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_arbitrum=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_arbitrum=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
feeController_arbitrum=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_arbitrum=117042327

# Avalanche
registry_avalanche=0x0000000000000000000000000000000000000000
deployer_avalanche=0x0000000000000000000000000000000000000000
relayer_avalanche=0x0000000000000000000000000000000000000000
feeController_avalanche=0x0000000000000000000000000000000000000000
block_avalanche=0

# BSC
registry_bsc=0x0000000000000000000000000000000000000000
deployer_bsc=0x0000000000000000000000000000000000000000
relayer_bsc=0x0000000000000000000000000000000000000000
feeController_bsc=0x0000000000000000000000000000000000000000
block_bsc=0

# Fantom
registry_fantom=0x0000000000000000000000000000000000000000
deployer_fantom=0x0000000000000000000000000000000000000000
relayer_fantom=0x0000000000000000000000000000000000000000
feeController_fantom=0x0000000000000000000000000000000000000000
block_fantom=0

# Gnosis
registry_gnosis=0x0000000000000000000000000000000000000000
deployer_gnosis=0x0000000000000000000000000000000000000000
relayer_gnosis=0x0000000000000000000000000000000000000000
feeController_gnosis=0x0000000000000000000000000000000000000000
block_gnosis=0

# Mainnet
registry_mainnet=0x0000000000000000000000000000000000000000
deployer_mainnet=0x0000000000000000000000000000000000000000
relayer_mainnet=0x0000000000000000000000000000000000000000
feeController_mainnet=0x0000000000000000000000000000000000000000
block_mainnet=0

# Optimism
registry_optimism=0x0000000000000000000000000000000000000000
deployer_optimism=0x0000000000000000000000000000000000000000
relayer_optimism=0x0000000000000000000000000000000000000000
feeController_optimism=0x0000000000000000000000000000000000000000
block_optimism=0

# Polygon
registry_polygon=0x0000000000000000000000000000000000000000
deployer_polygon=0x0000000000000000000000000000000000000000
relayer_polygon=0x0000000000000000000000000000000000000000
feeController_poligon=0x0000000000000000000000000000000000000000
block_polygon=0

# Validate network
networks=(arbitrum avalanche bsc fantom gnosis goerli mainnet polygon mumbai optimism)
if [[ -z $NETWORK || ! " ${networks[@]} " =~ " ${NETWORK} " ]]; then
  echo 'Please make sure the network provided is either: arbitrum, avalanche, bsc, fantom, gnosis, goerli, mainnet, polygon, mumbai, or optimism.'
  exit 1
fi

# Update network name properly
if [[ "$NETWORK" = "localhost" ]]; then
  ENV='mainnet'
elif [[ "$NETWORK" = "polygon" ]]; then
  ENV='matic'
elif [[ "$NETWORK" = "arbitrum" ]]; then
  ENV='arbitrum-one'
else
  ENV=${NETWORK}
fi

# Load start block
if [[ -z $BLOCK_NUMBER ]]; then
  BLOCK_NUMBER_VAR=block_$NETWORK
  BLOCK_NUMBER=${!BLOCK_NUMBER_VAR}
fi
if [[ -z $BLOCK_NUMBER ]]; then
  BLOCK_NUMBER=0
fi

# Load registry address
if [[ -z $REGISTRY_ADDRESS ]]; then
  REGISTRY_ADDRESS_VAR=registry_$NETWORK
  REGISTRY_ADDRESS=${!REGISTRY_ADDRESS_VAR}
fi

# Validate registry address
if [[ -z $REGISTRY_ADDRESS ]]; then
  echo 'Please make sure a Registry address is provided'
  exit 1
fi

# Load deployer address
if [[ -z $DEPLOYER_ADDRESS ]]; then
  DEPLOYER_ADDRESS_VAR=deployer_$NETWORK
  DEPLOYER_ADDRESS=${!DEPLOYER_ADDRESS_VAR}
fi

# Validate deployer address
if [[ -z $DEPLOYER_ADDRESS ]]; then
  echo 'Please make sure a Deployer address is provided'
  exit 1
fi

# Load relayer address
if [[ -z $RELAYER_ADDRESS ]]; then
  RELAYER_ADDRESS_VAR=relayer_$NETWORK
  RELAYER_ADDRESS=${!RELAYER_ADDRESS_VAR}
fi

# Validate relayer address
if [[ -z $RELAYER_ADDRESS ]]; then
  echo 'Please make sure a Relayer address is provided'
  exit 1
fi

# Load feeController address
if [[ -z $FEE_CONTROLLER_ADDRESS ]]; then
  FEE_CONTROLLER_ADDRESS_VAR=feeController_$NETWORK
  FEE_CONTROLLER_ADDRESS=${!FEE_CONTROLLER_ADDRESS_VAR}
fi

# Validate relayer address
if [[ -z $FEE_CONTROLLER_ADDRESS ]]; then
  echo 'Please make sure a Fee Controller address is provided'
  exit 1
fi

#################################################################
#####                     FINALIZE                         ######
#################################################################

# Remove previous manifest if there is any
if [ -f subgraph.yaml ]; then
  echo 'Removing previous subgraph manifest...'
  rm subgraph.yaml
fi

# Build subgraph manifest for requested variables
echo "Preparing new subgraph manifest for network ${NETWORK}"
cp subgraph.template.yaml subgraph.yaml
sed -i -e "s/{{network}}/${ENV}/g" subgraph.yaml
sed -i -e "s/{{registryAddress}}/${REGISTRY_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{deployerAddress}}/${DEPLOYER_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{relayerAddress}}/${RELAYER_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{feeControllerAddress}}/${FEE_CONTROLLER_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{blockNumber}}/${BLOCK_NUMBER}/g" subgraph.yaml
rm -f subgraph.yaml-e

# Build functions selector dictionary
echo "Building functions selector dictionary"
yarn ts-node ./scripts/build-permissions-dictionary.ts

# Run codegen and build
rm -rf ./types && yarn graph codegen -o types
yarn graph build
