import { Address, Bytes, log } from '@graphprotocol/graph-ts'

import {
  AcceptanceList,
  BaseSwapTask,
  CustomSlippage,
  CustomTokenOut,
  CustomTokenThreshold,
  CustomVolumeLimit,
  Task,
  TokenThreshold,
  VolumeLimit,
} from '../types/schema'
import {
  ConnectorSet,
  CustomMaxSlippageSet,
  CustomTokenOutSet,
  DefaultMaxSlippageSet,
  DefaultTokenOutSet,
} from '../types/templates/BaseSwap/BaseSwap'
import {
  BalanceConnectorsSet,
  CustomTokenThresholdSet,
  CustomVolumeLimitSet,
  DefaultTokenThresholdSet,
  DefaultVolumeLimitSet,
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
import { loadOrCreateERC20 } from './ERC20'

export function handleBalanceConnectorsSet(event: BalanceConnectorsSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.previousBalanceConnector = event.params.previous.toHexString()
  task.nextBalanceConnector = event.params.next.toHexString()
  task.save()
}

export function handleConnectorsSet(event: ConnectorSet): void {
  const task = BaseSwapTask.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.connector = event.params.connector.toHexString()
  task.save()
}

export function handlerCustomMaxSlippageSet(event: CustomMaxSlippageSet): void {
  const task = BaseSwapTask.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const customSlippageId = getCustomId(task, event.params.token)
  let customSlippage = CustomSlippage.load(customSlippageId)
  if (customSlippage === null) customSlippage = new CustomSlippage(customSlippageId)

  customSlippage.BaseSwapTask = task.id
  customSlippage.token = loadOrCreateERC20(event.params.token).id
  customSlippage.slippage = event.params.maxSlippage
  customSlippage.save()
}

export function handleCustomTokenOutSet(event: CustomTokenOutSet): void {
  const task = BaseSwapTask.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const customTokenOutId = getCustomId(task, event.params.token)
  let customTokenOut = CustomTokenOut.load(customTokenOutId)
  if (customTokenOut === null) customTokenOut = new CustomTokenOut(customTokenOutId)
  customTokenOut.BaseSwapTask = task.id
  customTokenOut.token = loadOrCreateERC20(event.params.token).id
  customTokenOut.tokenOut = loadOrCreateERC20(event.params.tokenOut).id
  customTokenOut.save()
}

export function handleCustomTokenThresholdSet(event: CustomTokenThresholdSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const customTokenThresholdId = getCustomTokenThresholdId(task, event.params.token)
  let tokenThreshold = TokenThreshold.load(customTokenThresholdId)
  if (tokenThreshold == null) tokenThreshold = new TokenThreshold(customTokenThresholdId)
  tokenThreshold.token = loadOrCreateERC20(event.params.thresholdToken).id
  tokenThreshold.min = event.params.min
  tokenThreshold.max = event.params.max
  tokenThreshold.save()

  const customTokenThreshold = new CustomTokenThreshold(customTokenThresholdId)
  customTokenThreshold.Task = task.id
  customTokenThreshold.token = loadOrCreateERC20(event.params.token).id
  customTokenThreshold.threshold = tokenThreshold.id
  customTokenThreshold.save()
}

export function handleCustomVolumeLimitSet(event: CustomVolumeLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const customVolumeLimitId = getCustomVolumeLimitId(task, event.params.token)
  let volumeLimit = VolumeLimit.load(customVolumeLimitId)
  if (volumeLimit == null) volumeLimit = new VolumeLimit(customVolumeLimitId)
  volumeLimit.token = loadOrCreateERC20(event.params.limitToken).id
  volumeLimit.amount = event.params.amount
  volumeLimit.period = event.params.period
  volumeLimit.save()

  let customVolumeLimit = CustomVolumeLimit.load(customVolumeLimitId)
  if (customVolumeLimit == null) customVolumeLimit = new CustomVolumeLimit(customVolumeLimitId)
  customVolumeLimit.Task = task.id
  customVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  customVolumeLimit.volumeLimit = volumeLimit.id
  customVolumeLimit.save()
}

export function handleDefaultMaxSlippageSet(event: DefaultMaxSlippageSet): void {
  const task = BaseSwapTask.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.defaultSlippage = event.params.maxSlippage
  task.save()
}

export function handleDefaultTokenOutSet(event: DefaultTokenOutSet): void {
  const task = BaseSwapTask.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.defaultTokenOut = loadOrCreateERC20(event.params.tokenOut).id
  task.save()
}

export function handleDefaultVolumeLimitSet(event: DefaultVolumeLimitSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const defaultVolumeLimitId = task.id
  let defaultVolumeLimit = VolumeLimit.load(defaultVolumeLimitId)
  if (defaultVolumeLimit == null) defaultVolumeLimit = new VolumeLimit(defaultVolumeLimitId)
  defaultVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  defaultVolumeLimit.amount = event.params.amount
  defaultVolumeLimit.period = event.params.period
  defaultVolumeLimit.save()
}

export function handleDefaultTokenThresholdSet(event: DefaultTokenThresholdSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const defaultTokenThresholdId = task.id
  let defaultTokenThreshold = TokenThreshold.load(defaultTokenThresholdId)
  if (defaultTokenThreshold == null) defaultTokenThreshold = new TokenThreshold(defaultTokenThresholdId)
  defaultTokenThreshold.token = loadOrCreateERC20(event.params.token).id
  defaultTokenThreshold.min = event.params.min
  defaultTokenThreshold.max = event.params.max
  defaultTokenThreshold.save()
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

export function handleTokensAcceptanceListSet(event: TokensAcceptanceListSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const acceptanceListId = task.id
  const acceptanceList = loadOrCreateAcceptanceList(acceptanceListId)
  const tokens = acceptanceList.tokens
  const token = loadOrCreateERC20(event.params.token).id
  const index = tokens.indexOf(token)
  if (token && index < 0) tokens.push(token)
  else if (token && index >= 0) tokens.splice(index, 1)
  acceptanceList.tokens = tokens
  acceptanceList.save()
}

export function handleTokensAcceptanceTypeSet(event: TokensAcceptanceTypeSet): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  const acceptanceListId = task.id
  const acceptanceList = loadOrCreateAcceptanceList(acceptanceListId)
  const acceptanceType = parseAcceptanceType(event.params.acceptanceType)
  acceptanceList.type = acceptanceType
  acceptanceList.save()
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

export function getCustomVolumeLimitId(task: Task, token: Address): string {
  return task.id.toString() + '/' + token.toHexString()
}

export function getCustomId(baseSwapTask: BaseSwapTask, token: Address): string {
  return baseSwapTask.id.toString() + '/' + token.toHexString()
}

export function getCustomTokenThresholdId(task: Task, token: Address): string {
  return task.id.toString() + '/' + token.toHexString()
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

export function loadOrCreateAcceptanceList(tokensAcceptanceListId: string): AcceptanceList {
  let acceptanceList = AcceptanceList.load(tokensAcceptanceListId)

  if (acceptanceList === null) {
    acceptanceList = new AcceptanceList(tokensAcceptanceListId)
    acceptanceList.Task = tokensAcceptanceListId
    acceptanceList.type = 'DenyList'
    acceptanceList.tokens = []
  }

  return acceptanceList
}

export function parseAcceptanceType(op: i32): string {
  if (op == 0) return 'DenyList'
  else return 'AllowList'
}
