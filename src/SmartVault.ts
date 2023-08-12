import { Address, log } from '@graphprotocol/graph-ts'

import { SmartVault as SmartVaultContract } from '../types/templates/SmartVault/SmartVault'

export function getRegistry(address: Address): Address {
  let smartVaultContract = SmartVaultContract.bind(address)
  let registryCall = smartVaultContract.try_registry()

  if (!registryCall.reverted) {
    return registryCall.value
  }

  log.warning('registry() call reverted for smart vault {}', [address.toHexString()])
  return Address.zero()
}

export function getAuthorizer(address: Address): Address {
  let smartVaultContract = SmartVaultContract.bind(address)
  let authorizerCall = smartVaultContract.try_authorizer()

  if (!authorizerCall.reverted) {
    return authorizerCall.value
  }

  log.warning('authorizer() call reverted for smart vault {}', [address.toHexString()])
  return Address.zero()
}

export function getPriceOracle(address: Address): Address {
  let smartVaultContract = SmartVaultContract.bind(address)
  let priceOracleCall = smartVaultContract.try_priceOracle()

  if (!priceOracleCall.reverted) {
    return priceOracleCall.value
  }

  log.warning('priceOracle() call reverted for smart vault {}', [address.toHexString()])
  return Address.zero()
}