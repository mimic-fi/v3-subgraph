import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import { CustomVolumeLimit, Task, VolumeLimit } from '../types/schema'
import {
  BalanceConnectorsSet,
  CustomVolumeLimitSet,
  DefaultVolumeLimitSet,
  GasPriceLimitSet,
  PriorityFeeLimitSet,
  Task as TaskContract,
  TimeLockDelaySet,
  TimeLockExecutionPeriodSet,
  TimeLockExpirationSet,
  TxCostLimitPctSet,
  TxCostLimitSet,
} from '../types/templates/Task/Task'
import { loadOrCreateERC20 } from './ERC20'

export function handleBalanceConnectorsSet(event: BalanceConnectorsSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.previousBalanceConnector = event.params.previous.toHexString()
  task.nextBalanceConnector = event.params.next.toHexString()
  task.save()
}

export function handleGasPriceLimitSet(event: GasPriceLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.gasPriceLimit = event.params.gasPriceLimit
  task.save()
}

export function handlePriorityFeeLimitSet(event: PriorityFeeLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.priorityFeeLimit = event.params.priorityFeeLimit
  task.save()
}

export function handleTxCostLimitPctSet(event: TxCostLimitPctSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.txCostLimitPct = event.params.txCostLimitPct
  task.save()
}

export function handleTxCostLimitSet(event: TxCostLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.txCostLimit = event.params.txCostLimit
  task.save()
}

export function handleTimeLockDelaySet(event: TimeLockDelaySet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.timeLockDelay = event.params.delay
  task.save()
}

export function handleTimeLockExecutionPeriodSet(event: TimeLockExecutionPeriodSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.timeLockExecutionPeriod = event.params.period
  task.save()
}

export function handleTimeLockExpirationSet(event: TimeLockExpirationSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.timeLockExpiration = event.params.expiration
  task.save()
}

export function handleCustomVolumeLimitSet(event: CustomVolumeLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const customVolumeLimitId = getCustomVolumeLimitId(task, event.params.token)
  const volumeLimit = loadOrCreateVolumeLimit(customVolumeLimitId)
  volumeLimit.task = task.id
  volumeLimit.token = loadOrCreateERC20(event.params.limitToken).id
  volumeLimit.amount = event.params.amount
  volumeLimit.period = event.params.period
  volumeLimit.save()

  const customVolumeLimit = new CustomVolumeLimit(customVolumeLimitId)
  customVolumeLimit.task = task.id
  customVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  customVolumeLimit.volumeLimit = volumeLimit.id
  customVolumeLimit.save()
}

export function handleDefaultVolumeLimitSet(event: DefaultVolumeLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const defaultVolumeLimitId = task.id
  const defaultVolumeLimit = loadOrCreateVolumeLimit(defaultVolumeLimitId)
  defaultVolumeLimit.task = task.id
  defaultVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  defaultVolumeLimit.amount = event.params.amount
  defaultVolumeLimit.period = event.params.period
  defaultVolumeLimit.save()
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

export function getTokensSource(address: Address): Address {
  const taskContract = TaskContract.bind(address)
  const tokensSourceCall = taskContract.try_getTokensSource()

  if (!tokensSourceCall.reverted) {
    return tokensSourceCall.value
  }

  log.warning('getTokensSource() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}

export function getExecutionType(address: Address): Bytes {
  const taskContract = TaskContract.bind(address)
  const executionTypeCall = taskContract.try_EXECUTION_TYPE()

  if (!executionTypeCall.reverted) {
    return executionTypeCall.value
  }

  log.warning('EXECUTION_TYPE() call reverted for task {}', [address.toHexString()])
  return Bytes.fromUTF8('')
}

export function getCustomVolumeLimitId(task: Task, token: Address): string {
  return task.id.toString() + '/' + token.toHexString()
}

export function loadOrCreateVolumeLimit(volumeLimitId: string): VolumeLimit {
  let volumeLimit = VolumeLimit.load(volumeLimitId)

  if (volumeLimit === null) {
    volumeLimit = new VolumeLimit(volumeLimitId)
    volumeLimit.task = volumeLimitId
    volumeLimit.token = loadOrCreateERC20(Address.zero()).id
    volumeLimit.period = BigInt.zero()
    volumeLimit.amount = BigInt.zero()
    volumeLimit.save()
  }

  return volumeLimit
}
