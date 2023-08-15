import { Address, BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import { Movement, Transaction, SmartVault, RelayedExecution } from '../types/schema'
import { SmartVault as SmartVaultContract } from '../types/templates/SmartVault/SmartVault'
import {
  BalanceConnectorUpdated,
  Called,
  Collected,
  Executed,
  Paused, 
  PriceOracleSet,
  Unpaused,
  Unwrapped,
  Withdrawn,
  Wrapped,
} from '../types/templates/SmartVault/SmartVault'

import { loadOrCreateERC20 } from './ERC20'

export function handleExecuted(event: Executed): void {
  createTransaction(event, 'Execute', BigInt.zero())
}

export function handleCall(event: Called): void {
  createTransaction(event, 'Call', BigInt.zero())
}

export function handleCollect(event: Collected): void {
  createTransaction(event, 'Collect', BigInt.zero())
}

export function handleWithdraw(event: Withdrawn): void {
  createTransaction(event, 'Withdraw', event.params.fee)
}

export function handleWrap(event: Wrapped): void {
  createTransaction(event, 'Wrap', BigInt.zero())
}

export function handleUnwrap(event: Unwrapped): void {
  createTransaction(event, 'Unwrap', BigInt.zero())
}

function createTransaction(event: ethereum.Event, type: string, fee: BigInt): void {
  let transactionId = getNextTransactionId(event.transaction.hash)
  let transaction = new Transaction(transactionId)
  transaction.hash = event.transaction.hash.toHexString()
  transaction.sender = event.transaction.from.toHexString()
  transaction.executedAt = event.block.timestamp
  transaction.smartVault = event.address.toHexString()
  transaction.type = type
  transaction.fee = fee
  transaction.save()

  for (let i: i32 = 0; true; i++) {
    const executionId = event.transaction.hash.toHexString() + '#' + i.toString()
    let execution = RelayedExecution.load(executionId)
    if (execution == null) break
    if (execution.transactions.load().length == 0) {
      transaction.relayedExecution = executionId
      transaction.save()
    }
  }
}

export function handleBalanceConnectorUpdated(event: BalanceConnectorUpdated): void {
  let movementId = getNextMovementId(event.transaction.hash)
  let movement = new Movement(movementId)
  movement.hash = event.transaction.hash.toHexString()
  movement.sender = event.transaction.from.toHexString()
  movement.executedAt = event.block.timestamp
  movement.smartVault = event.address.toHexString()
  movement.connector = event.params.id.toHexString()
  movement.token = loadOrCreateERC20(event.params.token).id
  movement.amount = event.params.amount
  movement.added = event.params.added
  movement.save()

  for (let i: i32 = 0; true; i++) {
    const executionId = event.transaction.hash.toHexString() + '#' + i.toString()
    let execution = RelayedExecution.load(executionId)
    if (execution == null) break
    if (execution.movements.load().length == 0) {
      movement.relayedExecution = executionId
      movement.save()
    }
  }
}

export function handlePaused(event: Paused): void {
  let smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.paused = true
  smartVault.save()
}

export function handleUnpaused(event: Unpaused): void {
  let smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.paused = false
  smartVault.save()
}

export function handlePriceOracleSet(event: PriceOracleSet): void {
  let smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.priceOracle = event.params.priceOracle.toHexString()
  smartVault.save()
}

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

function getNextMovementId(hash: Bytes): string {
  for (let i: i32 = 0; true; i++) {
    const movementId = hash.toHexString() + '#' + i.toString()
    if (Movement.load(movementId) == null) return movementId
  }

  throw Error('Could not find next movement ID')
}

function getNextTransactionId(hash: Bytes): string {
  for (let i: i32 = 0; true; i++) {
    const transactionId = hash.toHexString() + '#' + i.toString()
    if (Transaction.load(transactionId) == null) return transactionId
  }

  throw Error('Could not find next transaction ID')
}