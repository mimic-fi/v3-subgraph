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
import { Movement, RelayedExecution, RelayerParams, Task, Transaction } from '../types/schema'
import { Task as TaskContract } from '../types/templates/Task/Task'
import { rateInUsd } from './rates'
import { getWrappedNativeToken } from './rates/Tokens'

export function handleDeposited(event: Deposited): void {
  const relayerParams = loadOrCreateRelayerParams(event.params.smartVault.toHexString(), event.address)
  relayerParams.balance = relayerParams.balance.plus(event.params.amount)
  relayerParams.save()
}

export function handleGasPaid(event: GasPaid): void {
  const relayerParams = loadOrCreateRelayerParams(event.params.smartVault.toHexString(), event.address)
  const gasPaidAmount = event.params.amount
  relayerParams.balance = relayerParams.balance.minus(gasPaidAmount)
  relayerParams.quotaUsed = relayerParams.balance.plus(gasPaidAmount)
  relayerParams.save()
}

export function handleQuotaPaid(event: QuotaPaid): void {
  const relayerParams = loadOrCreateRelayerParams(event.params.smartVault.toHexString(), event.address)
  const quotaPaidAmount = event.params.amount
  relayerParams.balance = relayerParams.balance.minus(quotaPaidAmount)
  relayerParams.quotaUsed = relayerParams.quotaUsed.minus(quotaPaidAmount)
  relayerParams.save()
}

export function handleSmartVaultCollectorSet(event: SmartVaultCollectorSet): void {
  const relayerParams = loadOrCreateRelayerParams(event.params.smartVault.toHexString(), event.address)
  let collectorAddress = event.params.collector.toHexString()
  collectorAddress = event.params.collector.equals(Address.zero())
    ? getDefaultFeeCollector(event.address)
    : collectorAddress
  relayerParams.feeCollector = collectorAddress
  relayerParams.save()
}

export function handleSmartVaultMaxQuotaSet(event: SmartVaultMaxQuotaSet): void {
  const relayerParams = loadOrCreateRelayerParams(event.params.smartVault.toHexString(), event.address)
  relayerParams.maxQuota = event.params.maxQuota
  relayerParams.save()
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
  const relayerParams = loadOrCreateRelayerParams(event.params.smartVault.toHexString(), event.address)
  relayerParams.balance = relayerParams.balance.minus(event.params.amount)
  relayerParams.save()
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

export function loadOrCreateRelayerParams(smartVaultId: string, relayer: Address): RelayerParams {
  let relayerParams = RelayerParams.load(smartVaultId)

  if (relayerParams === null) {
    relayerParams = new RelayerParams(smartVaultId)
    relayerParams.smartVault = smartVaultId
    relayerParams.balance = BigInt.zero()
    relayerParams.feeCollector = getDefaultFeeCollector(relayer)
    relayerParams.maxQuota = BigInt.zero()
    relayerParams.quotaUsed = BigInt.zero()
    relayerParams.save()
  }
  return relayerParams
}
