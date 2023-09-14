import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import {
  DefaultCollectorSet,
  Deposited,
  SmartVaultCollectorSet,
  SmartVaultMaxQuotaSet,
  TaskExecuted,
  Withdrawn,
} from '../types/Relayer/Relayer'
import { Movement, RelayedExecution, RelayerParams, SmartVault, Task, Transaction } from '../types/schema'
import { SmartVault as SmartVaultContract } from '../types/templates/SmartVault/SmartVault'
import { Task as TaskContract } from '../types/templates/Task/Task'

export function handleDefaultCollectorSet(event: DefaultCollectorSet): void {
  const smartVault = SmartVault.load(event.address.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.address.toHexString()])

  const relayerParams = loadOrCreateRelayerParams(smartVault.id, event.address)
  const collectorAddress = event.params.collector.toHexString()
  relayerParams.feeCollector =
    collectorAddress == Address.zero().toHexString() ? getFeeCollector(event.address) : collectorAddress
  relayerParams.save()
}

export function handleDeposited(event: Deposited): void {
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.params.smartVault.toHexString()])

  const relayerParams = loadOrCreateRelayerParams(smartVault.id, event.address)
  relayerParams.balance = relayerParams.balance.plus(event.params.amount)
  relayerParams.save()
}

export function handleSmartVaultCollectorSet(event: SmartVaultCollectorSet): void {
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.params.smartVault.toHexString()])

  const relayerParams = loadOrCreateRelayerParams(smartVault.id, event.address)
  const collectorAddress = event.params.collector.toHexString()
  relayerParams.feeCollector =
    collectorAddress == Address.zero().toHexString() ? getFeeCollector(event.address) : collectorAddress
  relayerParams.save()
}

export function handleSmartVaultMaxQuotaSet(event: SmartVaultMaxQuotaSet): void {
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.params.smartVault.toHexString()])

  const relayerParams = loadOrCreateRelayerParams(smartVault.id, event.address)
  relayerParams.maxQuota = event.params.maxQuota
  relayerParams.save()
}

export function handleTaskExecuted(event: TaskExecuted): void {
  const task = Task.load(event.params.task.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.params.task.toHexString()])

  const executionId = event.transaction.hash.toHexString() + '#' + event.params.index.toString()
  const execution = new RelayedExecution(executionId)
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
  execution.costNative = event.transaction.gasPrice.times(event.params.gas)
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
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smart vault entity {}', [event.params.smartVault.toHexString()])

  const relayerParams = loadOrCreateRelayerParams(smartVault.id, event.address)
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

export function loadOrCreateRelayerParams(relayerParamsId: string, address: Address): RelayerParams {
  let relayerParams = RelayerParams.load(relayerParamsId)

  if (relayerParams === null) {
    relayerParams = new RelayerParams(relayerParamsId)
    relayerParams.smartVault = relayerParamsId
    relayerParams.balance = BigInt.zero()
    relayerParams.feeCollector = getFeeCollector(address)
    relayerParams.maxQuota = BigInt.zero()
    relayerParams.quotaUsed = BigInt.zero()
    relayerParams.save()
  }
  return relayerParams
}

function getFeeCollector(address: Address): string {
  return '0x000000'
  // let contract = SmartVaultContract.bind(address)
  // TODO: Ver que valores pasarle
  // let feeCollectorCall = contract.try_getBalanceConnector(address, )

  // if (!feeCollectorCall.reverted) {
  //   return feeCollectorCall.value.toHexString()
  // }

  // log.warning('feeCollector() call reverted for {}', [address.toHexString()])
  // return 'Unknown'
}
