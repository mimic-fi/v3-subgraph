import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import {
  Deposited,
  GasPaid,
  QuotaPaid,
  Relayer,
  SmartVaultCollectorSet,
  SmartVaultMaxQuotaSet,
  TaskExecuted,
  Withdrawn,
} from '../types/Relayer/Relayer'
import { Movement, RelayedExecution, RelayerConfig, Task, Transaction } from '../types/schema'
import { Task as TaskContract } from '../types/templates/Task/Task'
import { rateInUsd } from './rates'
import { getWrappedNativeToken } from './rates/Tokens'

export function handleDeposited(event: Deposited): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.balance = relayerConfig.balance.plus(event.params.amount)
  relayerConfig.save()
}

export function handleGasPaid(event: GasPaid): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.balance = relayerConfig.balance.minus(event.params.amount)
  relayerConfig.quotaUsed = relayerConfig.quotaUsed.plus(event.params.quota)
  relayerConfig.save()
}

export function handleQuotaPaid(event: QuotaPaid): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  const quotaPaidAmount = event.params.amount
  relayerConfig.balance = relayerConfig.balance.minus(quotaPaidAmount)
  relayerConfig.quotaUsed = relayerConfig.quotaUsed.minus(quotaPaidAmount)
  relayerConfig.save()
}

export function handleSmartVaultCollectorSet(event: SmartVaultCollectorSet): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  let feeCollector = event.params.collector.toHexString()
  if (feeCollector == Address.zero().toHexString()) feeCollector = getDefaultFeeCollector(event.address)
  relayerConfig.feeCollector = feeCollector
  relayerConfig.save()
}

export function handleSmartVaultMaxQuotaSet(event: SmartVaultMaxQuotaSet): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.maxQuota = event.params.maxQuota
  relayerConfig.save()
}

export function handleTaskExecuted(event: TaskExecuted): void {
  const task = Task.load(event.params.task.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.params.task.toHexString()])

  const executionId = event.transaction.hash.toHexString() + '#' + event.params.index.toString()
  const execution = new RelayedExecution(executionId)
  const costNative = event.transaction.gasPrice.times(event.params.gas)
  execution.hash = event.transaction.hash.toHexString()
  execution.sender = event.transaction.from.toHexString()
  execution.executedAt = event.block.timestamp
  execution.smartVault = getSmartVault(event.params.task).toHexString()
  execution.task = event.params.task.toHexString()
  execution.index = event.params.index
  execution.succeeded = event.params.success
  execution.result = event.params.result
  execution.gasUsed = event.params.gas
  execution.gasPrice = event.transaction.gasPrice
  execution.costNative = costNative
  execution.costUSD = rateInUsd(getWrappedNativeToken(), costNative)
  execution.environment = task.environment
  execution.save()

  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const movementId = event.transaction.hash.toHexString() + '#' + i.toString()
    const movement = Movement.load(movementId)
    if (movement == null) break
    if (movement.relayedExecution == null) {
      movement.relayedExecution = executionId
      movement.save()
    }
  }

  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const transactionId = event.transaction.hash.toHexString() + '#' + i.toString()
    const transaction = Transaction.load(transactionId)
    if (transaction == null) break
    if (transaction.relayedExecution == null) {
      transaction.relayedExecution = executionId
      transaction.save()
    }
  }
}

export function handleWithdrawn(event: Withdrawn): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.balance = relayerConfig.balance.minus(event.params.amount)
  relayerConfig.save()
}

export function getSmartVault(address: Address): Address {
  const taskContract = TaskContract.bind(address)
  const smartVaultCall = taskContract.try_smartVault()

  if (!smartVaultCall.reverted) {
    return smartVaultCall.value
  }

  log.warning('smartVault() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}

function getDefaultFeeCollector(address: Address): string {
  const contract = Relayer.bind(address)
  const feeCollectorCall = contract.try_defaultCollector()

  if (!feeCollectorCall.reverted) {
    return feeCollectorCall.value.toHexString()
  }

  log.warning('defaultCollector() call reverted for {}', [address.toHexString()])
  return 'Unknown'
}

export function loadOrCreateRelayerConfig(smartVaultId: string, relayer: Address): RelayerConfig {
  let relayerConfig = RelayerConfig.load(smartVaultId)

  if (relayerConfig === null) {
    relayerConfig = new RelayerConfig(smartVaultId)
    relayerConfig.smartVault = smartVaultId
    relayerConfig.feeCollector = getDefaultFeeCollector(relayer)
    relayerConfig.balance = BigInt.zero()
    relayerConfig.maxQuota = BigInt.zero()
    relayerConfig.quotaUsed = BigInt.zero()
    relayerConfig.save()
  }
  return relayerConfig
}
