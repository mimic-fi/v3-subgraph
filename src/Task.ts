import { Address, Bytes, log } from '@graphprotocol/graph-ts'

import { Task, TokensAcceptanceList } from '../types/schema'
import {
  BalanceConnectorsSet,
  GasPriceLimitSet,
  PriorityFeeLimitSet,
  Task as TaskContract,
  TimeLockDelaySet,
  TimeLockExecutionPeriodSet,
  TimeLockExpirationSet,
  TokensAcceptanceListSet,
  TokensAcceptanceTypeSet,
  TxCostLimitPctSet,
  TxCostLimitSet,
} from '../types/templates/Task/Task'

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

export function handleTokensAcceptanceTypeSet(event: TokensAcceptanceTypeSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const acceptanceType = parseAcceptanceType(event.params.acceptanceType)
  const acceptanceListId = task.id
  let acceptanceList = TokensAcceptanceList.load(acceptanceListId)
  if (acceptanceList == null) {
    acceptanceList = new TokensAcceptanceList(acceptanceListId)
    acceptanceList.task = task.id
    acceptanceList.tokensAcceptanceType = acceptanceType
    acceptanceList.tokens = []
  }
  acceptanceList.save()
}

export function handleTokensAcceptanceListSet(event: TokensAcceptanceListSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) {
    log.warning('Missing task entity {}', [event.address.toHexString()])
    return
  }

  const tokensAcceptanceListId = task.id
  const tokensAcceptanceList = TokensAcceptanceList.load(tokensAcceptanceListId)
  if (tokensAcceptanceList == null) {
    log.warning('Missing tokensAcceptanceType {}', [event.address.toHexString()])
    return
  }

  if (tokensAcceptanceList.tokens == null) {
    tokensAcceptanceList.tokens = []
  }

  const token = event.params.token.toHexString()
  if (tokensAcceptanceList.tokens != null) {
    tokensAcceptanceList.tokens.push(token)
  } else {
    tokensAcceptanceList.tokens = [token]
  }
  tokensAcceptanceList.save()
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

export function getSmartVault(address: Address): Address {
  const taskContract = TaskContract.bind(address)
  const smartVaultCall = taskContract.try_smartVault()

  if (!smartVaultCall.reverted) {
    return smartVaultCall.value
  }

  log.warning('smartVault() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}

export function getTokensAcceptanceListId(task: Task, acceptanceType: string): string {
  return task.id.toString() + '/' + acceptanceType
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

function parseAcceptanceType(op: i32): string {
  if (op == 0) return 'DenyList'
  else return 'AllowList'
}
