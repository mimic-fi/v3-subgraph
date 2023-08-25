import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import {
  Task,
  CustomVolumeLimit
} from '../types/schema'

import {
  BalanceConnectorsSet,
  CustomVolumeLimitSet,
  GasPriceLimitSet,
  PriorityFeeLimitSet,
  TxCostLimitPctSet,
  TxCostLimitSet, 
  TimeLockDelaySet,
  TimeLockExecutionPeriodSet,
  TimeLockExpirationSet 
} from '../types/templates/Task/Task'
import { Task as TaskContract } from '../types/templates/Task/Task'

import { loadOrCreateERC20 } from './ERC20'

export function handleBalanceConnectorsSet(event: BalanceConnectorsSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.previousBalanceConnector = event.params.previous.toHexString()
  task.nextBalanceConnector = event.params.next.toHexString()
  task.save()
}

export function handleGasPriceLimitSet(event: GasPriceLimitSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.gasPriceLimit = event.params.gasPriceLimit
  task.save()
}

export function handlePriorityFeeLimitSet(event: PriorityFeeLimitSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.priorityFeeLimit = event.params.priorityFeeLimit
  task.save()
}

export function handleTxCostLimitPctSet(event: TxCostLimitPctSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.txCostLimitPct = event.params.txCostLimitPct
  task.save()
}

export function handleTxCostLimitSet(event: TxCostLimitSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.txCostLimit = event.params.txCostLimit
  task.save()
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

  task.timeLockExecutionPeriod = event.params.period
  task.save()
}

export function handleTimeLockExpirationSet(event: TimeLockExpirationSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.timeLockExpiration = event.params.expiration
  task.save()
}

export function handleCustomVolumeLimitSet(event: CustomVolumeLimitSet): void {
  let task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  let customVolumeLimitId = getCustomVolumeLimitId(
    event.params.token,
    event.params.limitToken,
    event.params.amount,
    event.params.period
    )
  
  let customVolumeLimit = new CustomVolumeLimit(customVolumeLimitId)
  customVolumeLimit.task = task.id
  customVolumeLimit.token = loadOrCreateERC20(event.params.limitToken).id
  customVolumeLimit.limitToken = loadOrCreateERC20(event.params.limitToken).id
  customVolumeLimit.amount = event.params.amount
  customVolumeLimit.period = event.params.period

  customVolumeLimit.save()
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


export function getCustomVolumeLimitId(token: Address, limitToken: Address, amount: BigInt, period: BigInt): string {
  return token.toHexString() + '/' + limitToken.toHexString() + '/' + amount.toString() + '/' + period.toString()
}
