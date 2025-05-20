#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Arbitrum
registry_arbitrum=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_arbitrum=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_arbitrum=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_arbitrum=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_arbitrum=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_arbitrum=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_arbitrum=117042327

# Aurora
registry_aurora=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_aurora=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_aurora=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_aurora=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_aurora=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_aurora=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_aurora=104855032

# Avalanche
registry_avalanche=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_avalanche=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_avalanche=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_avalanche=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_avalanche=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_avalanche=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_avalanche=37130982

# Base
registry_base=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_base=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_base=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_base=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_base=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_base=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_base=5957564

# Blast
registry_blast=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_blast=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_blast=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_blast=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_blast=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_blast=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_blast=12945654

# BSC
registry_bsc=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_bsc=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_bsc=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_bsc=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_bsc=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_bsc=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_bsc=33066995

# Fantom
registry_fantom=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_fantom=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_fantom=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_fantom=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_fantom=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_fantom=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_fantom=69985942

# Gnosis
registry_gnosis=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_gnosis=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_gnosis=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_gnosis=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_gnosis=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_gnosis=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_gnosis=30715174

# Mainnet
registry_mainnet=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_mainnet=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_mainnet=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_mainnet=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_mainnet=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_mainnet=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_mainnet=18386855

# Mode
registry_mode=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_mode=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_mode=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_mode=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_mode=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_mode=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_mode=17840787

# Optimism
registry_optimism=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_optimism=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_optimism=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_optimism=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_optimism=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_optimism=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_optimism=111552683

# Polygon
registry_polygon=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_polygon=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_polygon=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_polygon=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_polygon=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_polygon=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_polygon=49350048

# Sonic
registry_sonic=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_sonic=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_sonic=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_sonic=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_sonic=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_sonic=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_sonic=2879191

# zkEVM
registry_zkevm=0x1675BF3F75046aCd131caD845eb8FF3Bed49a643
deployer_zkevm=0x849B7B1102B0dcf6eC10f98b81C8D1c38f7cbf24
relayer_1_zkevm=0xD7252C026c3cA28D73B4DeeF62FE6ADe86eC17A9
relayer_2_zkevm=0x54FC6E302043aAF56154e8B4A7F01645eDAdA906
relayer_3_zkevm=0x9E0A538749A486bbF127F8848a6f2CF4e1e92DbD
feeController_zkevm=0x88586bfc840b99680c8cc753a36b51999608b1f6
block_zkevm=6788022

# Validate network
networks=(arbitrum aurora avalanche base blast bsc fantom gnosis mainnet mode optimism polygon sonic zkevm)
if [[ -z $NETWORK || ! " ${networks[@]} " =~ " ${NETWORK} " ]]; then
  echo 'Please make sure the network provided is either: arbitrum, aurora, avalanche, base, blast, bsc, fantom, gnosis, mainnet, mode, optimism, polygon, sonic, or zkevm.'
  exit 1
fi

# Update network name properly
if [[ "$NETWORK" = "localhost" ]]; then
  ENV='mainnet'
elif [[ "$NETWORK" = "polygon" ]]; then
  ENV='matic'
elif [[ "$NETWORK" = "arbitrum" ]]; then
  ENV='arbitrum-one'
elif [[ "$NETWORK" = "zkevm" ]]; then
  ENV='polygon-zkevm'
elif [[ "$NETWORK" = "blast" ]]; then
  ENV='blast-mainnet'
elif [[ "$NETWORK" = "mode" ]]; then
  ENV='mode-mainnet'
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

# Load relayer 1 address
if [[ -z $RELAYER_1_ADDRESS ]]; then
  RELAYER_1_ADDRESS_VAR=relayer_1_$NETWORK
  RELAYER_1_ADDRESS=${!RELAYER_1_ADDRESS_VAR}
fi

# Validate relayer 1 address
if [[ -z $RELAYER_1_ADDRESS ]]; then
  echo 'Please make sure a Relayer 1 address is provided'
  exit 1
fi

# Load relayer 2 address
if [[ -z $RELAYER_2_ADDRESS ]]; then
  RELAYER_2_ADDRESS_VAR=relayer_2_$NETWORK
  RELAYER_2_ADDRESS=${!RELAYER_2_ADDRESS_VAR}
fi

# Validate relayer 2 address
if [[ -z $RELAYER_2_ADDRESS ]]; then
  echo 'Please make sure a Relayer 2 address is provided'
  exit 1
fi

# Load relayer 3 address
if [[ -z $RELAYER_3_ADDRESS ]]; then
  RELAYER_3_ADDRESS_VAR=relayer_3_$NETWORK
  RELAYER_3_ADDRESS=${!RELAYER_3_ADDRESS_VAR}
fi

# Validate relayer 3 address
if [[ -z $RELAYER_3_ADDRESS ]]; then
  echo 'Please make sure a Relayer 3 address is provided'
  exit 1
fi

# Load fee controller address
if [[ -z $FEE_CONTROLLER_ADDRESS ]]; then
  FEE_CONTROLLER_ADDRESS_VAR=feeController_$NETWORK
  FEE_CONTROLLER_ADDRESS=${!FEE_CONTROLLER_ADDRESS_VAR}
fi

# Validate fee controller address
if [[ -z $FEE_CONTROLLER_ADDRESS ]]; then
  echo 'Please make sure a Fee Controller address is provided'
  exit 1
fi

#################################################################
#####                     FINALIZE                         ######
#################################################################

# Remove previous manifest if there is any
if [ -f subgraph.yaml ]; then
  echo 'Removing previous subgraph manifest'
  rm subgraph.yaml
fi

# Build subgraph manifest for requested variables
echo "Preparing new subgraph manifest for network ${NETWORK}"
cp subgraph.template.yaml subgraph.yaml
sed -i -e "s/{{network}}/${ENV}/g" subgraph.yaml
sed -i -e "s/{{registryAddress}}/${REGISTRY_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{deployerAddress}}/${DEPLOYER_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{relayer1Address}}/${RELAYER_1_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{relayer2Address}}/${RELAYER_2_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{relayer3Address}}/${RELAYER_3_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{feeControllerAddress}}/${FEE_CONTROLLER_ADDRESS}/g" subgraph.yaml
sed -i -e "s/{{blockNumber}}/${BLOCK_NUMBER}/g" subgraph.yaml
rm -f subgraph.yaml-e

# Build tokens source set event handlers
echo "Building tokens source set event handlers"
output=$(yarn ts-node ./scripts/build-tokens-source-event-handlers.ts)

# Build functions selectors dictionary
echo "Building functions selectors dictionary"
output=$(yarn ts-node ./scripts/build-permissions-dictionary.ts)

# Check dictionary build status
if [ $? -ne 0 ]; then
    echo "Error trying to build functions selectors dictionary with exit status $?"
    echo "$output"
    exit $?
fi

# Run codegen
echo "Generating graph types"
rm -rf ./types && yarn graph codegen -o types
yarn graph build
