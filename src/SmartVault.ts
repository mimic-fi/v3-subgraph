import { Address, BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import {
  BalanceConnector,
  BalanceConnectorBalance,
  Movement,
  RelayedExecution,
  SmartVault,
  SmartVaultCall,
} from '../types/schema'
import {
  BalanceConnectorUpdated,
  Called,
  Collected,
  Executed,
  Paused,
  PriceOracleSet,
  SmartVault as SmartVaultContract,
  Unpaused,
  Unwrapped,
  Withdrawn,
  Wrapped,
} from '../types/templates/SmartVault/SmartVault'
import { loadOrCreateERC20 } from './ERC20'

export function handleExecuted(event: Executed): void {
  createSmartVaultCall(event, 'Execute', BigInt.zero())
}

export function handleCalled(event: Called): void {
  createSmartVaultCall(event, 'Call', BigInt.zero())
}

export function handleCollected(event: Collected): void {
  createSmartVaultCall(event, 'Collect', BigInt.zero())
}

export function handleWithdrawn(event: Withdrawn): void {
  createSmartVaultCall(event, 'Withdraw', event.params.fee)
}

export function handleWrapped(event: Wrapped): void {
  createSmartVaultCall(event, 'Wrap', BigInt.zero())
}

export function handleUnwrapped(event: Unwrapped): void {
  createSmartVaultCall(event, 'Unwrap', BigInt.zero())
}

function createSmartVaultCall(event: ethereum.Event, smartVaultCallType: string, fee: BigInt): void {
  const relayedExecutionId = getNextRelayedExecutionId(event.transaction.hash)
  const smartVaultCallId = getNextSmartVaultCallId(relayedExecutionId)
  const smartVaultCall = new SmartVaultCall(smartVaultCallId)
  smartVaultCall.hash = event.transaction.hash.toHexString()
  smartVaultCall.sender = event.transaction.from.toHexString()
  smartVaultCall.executedAt = event.block.timestamp
  smartVaultCall.smartVault = event.address.toHexString()
  smartVaultCall.type = smartVaultCallType
  smartVaultCall.fee = fee
  smartVaultCall.relayedExecution = relayedExecutionId
  smartVaultCall.save()
}

export function handleBalanceConnectorUpdated(event: BalanceConnectorUpdated): void {
  const relayedExecutionId = getNextRelayedExecutionId(event.transaction.hash)
  const movementId = getNextMovementId(relayedExecutionId)
  const movement = new Movement(movementId)
  movement.hash = event.transaction.hash.toHexString()
  movement.sender = event.transaction.from.toHexString()
  movement.executedAt = event.block.timestamp
  movement.smartVault = event.address.toHexString()
  movement.connector = event.params.id.toHexString()
  movement.token = loadOrCreateERC20(event.params.token).id
  movement.amount = event.params.amount
  movement.added = event.params.added
  movement.relayedExecution = relayedExecutionId
  movement.save()

  const balanceConnectorBalance = loadOrCreateBalanceConnectorBalance(event)
  balanceConnectorBalance.amount = event.params.added
    ? balanceConnectorBalance.amount.plus(event.params.amount)
    : balanceConnectorBalance.amount.minus(event.params.amount)
  balanceConnectorBalance.save()
}

export function handlePaused(event: Paused): void {
  const smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.paused = true
  smartVault.save()
}

export function handleUnpaused(event: Unpaused): void {
  const smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.paused = false
  smartVault.save()
}

export function handlePriceOracleSet(event: PriceOracleSet): void {
  const smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.priceOracle = event.params.priceOracle.toHexString()
  smartVault.save()
}

function loadOrCreateBalanceConnector(event: BalanceConnectorUpdated): BalanceConnector {
  const balanceConnectorId = event.address.toHexString() + '-' + event.params.id.toHexString()
  let balanceConnector = BalanceConnector.load(balanceConnectorId)

  if (balanceConnector == null) {
    balanceConnector = new BalanceConnector(balanceConnectorId)
    balanceConnector.smartVault = event.address.toHexString()
    balanceConnector.connector = event.params.id.toHexString()
    balanceConnector.save()
  }

  return balanceConnector
}

function loadOrCreateBalanceConnectorBalance(event: BalanceConnectorUpdated): BalanceConnectorBalance {
  const balanceConnector = loadOrCreateBalanceConnector(event)
  const balanceConnectorBalanceId = balanceConnector.id + '-' + event.params.token.toHexString()
  let balanceConnectorBalance = BalanceConnectorBalance.load(balanceConnectorBalanceId)

  if (balanceConnectorBalance == null) {
    balanceConnectorBalance = new BalanceConnectorBalance(balanceConnectorBalanceId)
    balanceConnectorBalance.connector = balanceConnector.id
    balanceConnectorBalance.token = loadOrCreateERC20(event.params.token).id
    balanceConnectorBalance.amount = BigInt.zero()
    balanceConnectorBalance.save()
  }

  return balanceConnectorBalance
}

export function getRegistry(address: Address): Address {
  const smartVaultContract = SmartVaultContract.bind(address)
  const registryCall = smartVaultContract.try_registry()

  if (!registryCall.reverted) {
    return registryCall.value
  }

  log.warning('registry() call reverted for smart vault {}', [address.toHexString()])
  return Address.zero()
}

export function getAuthorizer(address: Address): Address {
  const smartVaultContract = SmartVaultContract.bind(address)
  const authorizerCall = smartVaultContract.try_authorizer()

  if (!authorizerCall.reverted) {
    return authorizerCall.value
  }

  log.warning('authorizer() call reverted for smart vault {}', [address.toHexString()])
  return Address.zero()
}

export function getPriceOracle(address: Address): Address {
  const smartVaultContract = SmartVaultContract.bind(address)
  const priceOracleCall = smartVaultContract.try_priceOracle()

  if (!priceOracleCall.reverted) {
    return priceOracleCall.value
  }

  log.warning('priceOracle() call reverted for smart vault {}', [address.toHexString()])
  return Address.zero()
}

function getNextMovementId(relayedExecutionId: string): string {
  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const movementId = relayedExecutionId + '#' + i.toString()
    if (Movement.load(movementId) == null) return movementId
  }

  throw Error('Could not find next Movement ID')
}

function getNextSmartVaultCallId(relayedExecutionId: string): string {
  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const smartVaultCallId = relayedExecutionId + '#' + i.toString()
    if (SmartVaultCall.load(smartVaultCallId) == null) return smartVaultCallId
  }

  throw Error('Could not find next SmartVaultCall ID')
}

function getNextRelayedExecutionId(hash: Bytes): string {
  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const executionId = hash.toHexString() + '#' + i.toString()
    if (RelayedExecution.load(executionId) == null) return executionId
  }

  throw Error('Could not find next RelayedExecution ID')
}
