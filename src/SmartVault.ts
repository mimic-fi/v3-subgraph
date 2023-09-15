import { Address, BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import { Movement, RelayedExecution, SmartVault, Stats, Transaction } from '../types/schema'
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
import { rateInUsd } from './rates'
import { getWrappedNativeToken } from './rates/Tokens'

const REDEEM_GAS_NOTE = '0x52454c41594552'

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
  handleUsdWithdraw(event, event.params.fee)
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
  //eslint-disable-next-line-no-non-null-assertion
  transaction.gasUsed = event.receipt!.gasUsed
  transaction.gasPrice = event.transaction.gasPrice
  transaction.costNative = transaction.gasPrice.times(transaction.gasUsed)
  transaction.costUsd = rateInUsd(getWrappedNativeToken(), transaction.costNative)
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

export function handleUsdWithdraw(event: Withdrawn, fee: BigInt): void {
  const transactionId = getNextTransactionId(event.transaction.hash)
  const transaction = Transaction.load(transactionId)
  if (transaction == null) return log.warning('Missing transaction vault entity {}', [event.address.toHexString()])

  const feeUsd = rateInUsd(event.params.token, fee)
  transaction.feeUsd = feeUsd
  transaction.save()

  const smartVault = SmartVault.load(event.address.toHexString())
  const amountUsd = rateInUsd(event.params.token, event.params.amount)
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  smartVault.totalFeesUsd = smartVault.totalFeesUsd.plus(transaction.feeUsd)
  smartVault.totalValueManaged = smartVault.totalValueManaged.plus(amountUsd)

  const isRelayedTx = event.params.recipient.toHexString() == REDEEM_GAS_NOTE
  const gasRefundUsd = isRelayedTx ? amountUsd : BigInt.zero()
  smartVault.totalGasRefundsUsd = smartVault.totalGasRefundsUsd.plus(gasRefundUsd)

  const relayedCostUsd = isRelayedTx ? transaction.costUsd : BigInt.zero()
  smartVault.totalRelayedCostUsd = smartVault.totalRelayedCostUsd.plus(relayedCostUsd)
  smartVault.save()
  trackGlobalStats(amountUsd, feeUsd, gasRefundUsd, relayedCostUsd)
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

function trackGlobalStats(valueManagedUsd: BigInt, feeUsd: BigInt, gasRefundUsd: BigInt, relayedCostUsd: BigInt): void {
  let stats = Stats.load('MIMIC_STATS')

  if (stats == null) {
    stats = new Stats('MIMIC_STATS')
    stats.totalValueManaged = BigInt.zero()
    stats.totalFeesUsd = BigInt.zero()
    stats.totalGasRefundsUsd = BigInt.zero()
    stats.totalRelayedCostUsd = BigInt.zero()
    stats.save()
  }

  stats.totalValueManaged = stats.totalValueManaged.plus(valueManagedUsd)
  stats.totalFeesUsd = stats.totalFeesUsd.plus(feeUsd)
  stats.totalGasRefundsUsd = stats.totalGasRefundsUsd.plus(gasRefundUsd)
  stats.totalRelayedCostUsd = stats.totalRelayedCostUsd.plus(relayedCostUsd)
  stats.save()
}
