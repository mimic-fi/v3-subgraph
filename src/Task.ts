import { Address, Bytes, log } from '@graphprotocol/graph-ts'

import { Task } from '../types/schema'

import { BalanceConnectorsSet,
  TimeLockDelaySet,
  TimeLockExecutionPeriodSet,
  TimeLockExpirationSet } from '../types/templates/Task/Task'
import { Task as TaskContract } from '../types/templates/Task/Task'

export function handleBalanceConnectorsSet(event: BalanceConnectorsSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.previousBalanceConnector = event.params.previous.toHexString()
  task.nextBalanceConnector = event.params.next.toHexString()
  task.save()
}

export function getSmartVault(address: Address): Address {
  let taskContract = TaskContract.bind(address)
  let smartVaultCall = taskContract.try_smartVault()

  if (!smartVaultCall.reverted) {
    return smartVaultCall.value
  }

  log.warning('smartVault() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}

export function getTokensSource(address: Address): Address {
  let taskContract = TaskContract.bind(address)
  let tokensSourceCall = taskContract.try_getTokensSource()

  if (!tokensSourceCall.reverted) {
    return tokensSourceCall.value
  }

  log.warning('getTokensSource() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}

export function getExecutionType(address: Address): Bytes {
  let taskContract = TaskContract.bind(address)
  let executionTypeCall = taskContract.try_EXECUTION_TYPE()

  if (!executionTypeCall.reverted) {
    return executionTypeCall.value
  }

  log.warning('EXECUTION_TYPE() call reverted for task {}', [address.toHexString()])
  return Bytes.fromUTF8('')
}

export function handleTimeLockDelaySet(event : TimeLockDelaySet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])
  
  task.timeLockDelay = event.params.delay
  task.save()
}

export function handleTimeLockExecutionPeriodSet(event: TimeLockExecutionPeriodSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.timeLockExecutionPeriodSet = event.params.period
  task.save()
}

export function handleTimeLockExpirationSet(event: TimeLockExpirationSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.timeLockExpirationSet = event.params.expiration
  task.save()
}

