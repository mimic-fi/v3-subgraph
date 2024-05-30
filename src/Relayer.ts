import { Address, BigInt, ethereum, log } from '@graphprotocol/graph-ts'

import {
  DefaultCollectorSet,
  Deposited,
  ExecutorSet,
  GasPaid,
  QuotaPaid,
  Relayer,
  SmartVaultCollectorSet,
  SmartVaultMaxQuotaSet,
  TaskExecuted,
  Withdrawn,
} from '../types/Relayer_2/Relayer'
import {
  Executor,
  Movement,
  RelayedExecution,
  RelayedTransaction,
  RelayerConfig,
  RelayerDefaultConfig,
  SmartVault,
  SmartVaultCall,
  Task,
} from '../types/schema'
import { Task as TaskContract } from '../types/templates/Task/Task'
import { loadOrCreateNativeToken } from './ERC20'
import { rateNativeInUsd } from './PriceOracle'

export function handleDeposited(event: Deposited): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.balance = relayerConfig.balance.plus(event.params.amount)
  relayerConfig.save()
}

export function handleExecutorSet(event: ExecutorSet): void {
  const relayerDefaultConfig = loadOrCreateRelayerDefaultConfig(event.address.toHexString())
  const executor = loadOrCreateExecutor(event.params.executor.toHexString(), relayerDefaultConfig)
  executor.allowed = event.params.allowed
  executor.save()
}

export function handleGasPaid(event: GasPaid): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.balance = relayerConfig.balance.minus(event.params.amount.minus(event.params.quota))
  relayerConfig.quotaUsed = relayerConfig.quotaUsed.plus(event.params.quota)
  relayerConfig.save()

  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.params.smartVault.toHexString()])

  const transaction = loadOrCreateRelayedTransaction(smartVault.environment, smartVault.id, event)
  transaction.gasUsed = event.params.amount.div(event.transaction.gasPrice)
  transaction.gasPrice = event.transaction.gasPrice
  transaction.costNative = event.params.amount
  transaction.costUSD = rateNativeInUsd(event.params.amount)
  transaction.save()
}

export function handleQuotaPaid(event: QuotaPaid): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  const quotaPaidAmount = event.params.amount
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

export function handleDefaultSmartVaulCollectorSet(event: DefaultCollectorSet): void {
  const relayerDefaultConfig = loadOrCreateRelayerDefaultConfig(event.address.toHexString())
  const defaultCollector = event.params.collector.toHexString()
  relayerDefaultConfig.defaultFeeCollector = defaultCollector
  relayerDefaultConfig.save()
}

export function handleSmartVaultMaxQuotaSet(event: SmartVaultMaxQuotaSet): void {
  const relayerConfig = loadOrCreateRelayerConfig(event.params.smartVault.toHexString(), event.address)
  relayerConfig.maxQuota = event.params.maxQuota
  relayerConfig.save()
}

export function handleTaskExecuted(event: TaskExecuted): void {
  const task = Task.load(event.params.task.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.params.task.toHexString()])

  const smartVault = getSmartVault(event.params.task).toHexString()
  const transaction = loadOrCreateRelayedTransaction(task.environment, smartVault, event)

  const executionId = event.transaction.hash.toHexString() + '#' + event.params.index.toString()
  const execution = new RelayedExecution(executionId)
  const costNative = event.transaction.gasPrice.times(event.params.gas)
  execution.transaction = transaction.id
  execution.executedAt = event.block.timestamp
  execution.smartVault = smartVault
  execution.task = event.params.task.toHexString()
  execution.index = event.params.index
  execution.succeeded = event.params.success
  execution.result = event.params.result
  execution.gasUsed = event.params.gas
  execution.gasPrice = event.transaction.gasPrice
  execution.costNative = costNative
  execution.costUSD = rateNativeInUsd(costNative)
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
    const smartVaultCallId = event.transaction.hash.toHexString() + '#' + i.toString()
    const smartVaultCall = SmartVaultCall.load(smartVaultCallId)
    if (smartVaultCall == null) break
    if (smartVaultCall.relayedExecution == null) {
      smartVaultCall.relayedExecution = executionId
      smartVaultCall.save()
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

export function loadOrCreateRelayedTransaction(
  environment: string,
  smartVault: string,
  event: ethereum.Event
): RelayedTransaction {
  // Relayers cannot execute tasks from multiple smart vaults in a single transaction
  // Therefore, using the transaction hash to identify a relayed transaction is correct
  const transactionId = event.transaction.hash.toHexString()
  let transaction = RelayedTransaction.load(transactionId)

  if (transaction === null) {
    transaction = new RelayedTransaction(transactionId)
    transaction.environment = environment
    transaction.smartVault = smartVault
    transaction.hash = event.transaction.hash.toHexString()
    transaction.sender = event.transaction.from.toHexString()
    transaction.executedAt = event.block.timestamp
    transaction.gasUsed = BigInt.zero()
    transaction.gasPrice = BigInt.zero()
    transaction.costUSD = BigInt.zero()
    transaction.costNative = BigInt.zero()
    transaction.save()
  }

  return transaction
}

export function loadOrCreateRelayerConfig(smartVaultId: string, relayer: Address): RelayerConfig {
  let relayerConfig = RelayerConfig.load(smartVaultId)

  if (relayerConfig === null) {
    relayerConfig = new RelayerConfig(smartVaultId)
    relayerConfig.smartVault = smartVaultId
    relayerConfig.feeCollector = getDefaultFeeCollector(relayer)
    relayerConfig.balance = BigInt.zero()
    relayerConfig.maxQuota = BigInt.zero()
    relayerConfig.nativeToken = loadOrCreateNativeToken().id
    relayerConfig.quotaUsed = BigInt.zero()
    relayerConfig.save()
  }

  return relayerConfig
}

export function loadOrCreateRelayerDefaultConfig(relayerId: string): RelayerDefaultConfig {
  let relayer = RelayerDefaultConfig.load(relayerId)

  if (relayer === null) {
    relayer = new RelayerDefaultConfig(relayerId)
  }

  return relayer
}

export function loadOrCreateExecutor(executorId: string, relayerDefaultConfig: RelayerDefaultConfig): Executor {
  let executor = Executor.load(executorId)

  if (executor === null) {
    executor = new Executor(executorId)
    executor.relayerDefaultConfig = relayerDefaultConfig.id
    executor.allowed = false
    executor.save()
  }

  return executor
}
