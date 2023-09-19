import { Address, BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import { Movement, RelayedExecution, SmartVault, Transaction } from '../types/schema'
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
  createTransaction(event, 'Execute', BigInt.zero())
}

export function handleCalled(event: Called): void {
  createTransaction(event, 'Call', BigInt.zero())
}

export function handleCollected(event: Collected): void {
  createTransaction(event, 'Collect', BigInt.zero())
}

export function handleWithdrawn(event: Withdrawn): void {
  createTransaction(event, 'Withdraw', event.params.fee)
}

export function handleWrapped(event: Wrapped): void {
  createTransaction(event, 'Wrap', BigInt.zero())
}

export function handleUnwrapped(event: Unwrapped): void {
  createTransaction(event, 'Unwrap', BigInt.zero())
}

function createTransaction(event: ethereum.Event, type: string, fee: BigInt): void {
  const transactionId = getNextTransactionId(event.transaction.hash)
  const transaction = new Transaction(transactionId)

  transaction.hash = event.transaction.hash.toHexString()
  transaction.sender = event.transaction.from.toHexString()
  transaction.executedAt = event.block.timestamp
  transaction.smartVault = event.address.toHexString()
  transaction.type = type
  transaction.fee = fee
  transaction.save()

  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const executionId = event.transaction.hash.toHexString() + '#' + i.toString()
    const execution = RelayedExecution.load(executionId)
    if (execution == null) break
    if (execution.transactions.load().length == 0) {
      transaction.relayedExecution = executionId
      transaction.save()
    }
  }
}

export function handleBalanceConnectorUpdated(event: BalanceConnectorUpdated): void {
  const movementId = getNextMovementId(event.transaction.hash)
  const movement = new Movement(movementId)
  movement.hash = event.transaction.hash.toHexString()
  movement.sender = event.transaction.from.toHexString()
  movement.executedAt = event.block.timestamp
  movement.smartVault = event.address.toHexString()
  movement.connector = event.params.id.toHexString()
  movement.token = loadOrCreateERC20(event.params.token).id
  movement.amount = event.params.amount
  movement.added = event.params.added
  movement.save()

  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const executionId = event.transaction.hash.toHexString() + '#' + i.toString()
    const execution = RelayedExecution.load(executionId)
    if (execution == null) break
    if (execution.movements.load().length == 0) {
      movement.relayedExecution = executionId
      movement.save()
    }
  }
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

function getNextMovementId(hash: Bytes): string {
  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const movementId = hash.toHexString() + '#' + i.toString()
    if (Movement.load(movementId) == null) return movementId
  }

  throw Error('Could not find next movement ID')
}

function getNextTransactionId(hash: Bytes): string {
  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const transactionId = hash.toHexString() + '#' + i.toString()
    if (Transaction.load(transactionId) == null) return transactionId
  }

  throw Error('Could not find next transaction ID')
}
