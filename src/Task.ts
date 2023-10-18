import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import {
  AcceptanceList,
  CustomDestinationChain,
  CustomMaxSlippage,
  CustomTokenOut,
  CustomTokenThreshold,
  CustomVolumeLimit,
  Task,
  TaskConfig,
  TokenThreshold,
  VolumeLimit,
} from '../types/schema'
import {
  BalanceConnectorsSet,
  ConnectorSet,
  CustomDestinationChainSet,
  CustomMaxSlippageSet,
  CustomTokenOutSet,
  CustomTokenThresholdSet,
  CustomVolumeLimitSet,
  DefaultDestinationChainSet,
  DefaultMaxSlippageSet,
  DefaultTokenOutSet,
  DefaultTokenThresholdSet,
  DefaultVolumeLimitSet,
  GasPriceLimitSet,
  Paused,
  PriorityFeeLimitSet,
  RecipientSet,
  Task as TaskContract,
  TimeLockDelaySet,
  TimeLockExecutionPeriodSet,
  TimeLockExpirationSet,
  TokensAcceptanceListSet,
  TokensAcceptanceTypeSet,
  TxCostLimitPctSet,
  TxCostLimitSet,
  Unpaused,
} from '../types/templates/Task/Task'
import { loadOrCreateERC20 } from './ERC20'

export function handleBalanceConnectorsSet(event: BalanceConnectorsSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.previousBalanceConnector = event.params.previous.toHexString()
  taskConfig.nextBalanceConnector = event.params.next.toHexString()
  taskConfig.save()
}

export function handleConnectorSet(event: ConnectorSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.connector = event.params.connector.toHexString()
  taskConfig.save()
}

export function handleCustomMaxSlippageSet(event: CustomMaxSlippageSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const customMaxSlippageId = getTaskCustomConfigId(taskConfig, event.params.token)

  let customMaxSlippage = CustomMaxSlippage.load(customMaxSlippageId)
  if (customMaxSlippage === null) customMaxSlippage = new CustomMaxSlippage(customMaxSlippageId)
  customMaxSlippage.taskConfig = taskConfig.id
  customMaxSlippage.token = loadOrCreateERC20(event.params.token).id
  customMaxSlippage.maxSlippage = event.params.maxSlippage
  customMaxSlippage.save()
}

export function handleCustomDestinationChainSet(event: CustomDestinationChainSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const customDestinationChainId = getTaskCustomConfigId(taskConfig, event.params.token)

  let customDestinationChain = CustomDestinationChain.load(customDestinationChainId)
  if (customDestinationChain === null) customDestinationChain = new CustomDestinationChain(customDestinationChainId)
  customDestinationChain.taskConfig = taskConfig.id
  customDestinationChain.token = loadOrCreateERC20(event.params.token).id
  customDestinationChain.destinationChain = event.params.destinationChain
  customDestinationChain.save()
}

export function handleCustomTokenOutSet(event: CustomTokenOutSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const customTokenOutId = getTaskCustomConfigId(taskConfig, event.params.token)

  let customTokenOut = CustomTokenOut.load(customTokenOutId)
  if (customTokenOut === null) customTokenOut = new CustomTokenOut(customTokenOutId)
  customTokenOut.taskConfig = taskConfig.id
  customTokenOut.token = loadOrCreateERC20(event.params.token).id
  customTokenOut.tokenOut = loadOrCreateERC20(event.params.tokenOut).id
  customTokenOut.save()
}

export function handleCustomTokenThresholdSet(event: CustomTokenThresholdSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const customTokenThresholdId = getTaskCustomConfigId(taskConfig, event.params.token)

  let tokenThreshold = TokenThreshold.load(customTokenThresholdId)
  if (tokenThreshold == null) tokenThreshold = new TokenThreshold(customTokenThresholdId)
  tokenThreshold.token = loadOrCreateERC20(event.params.thresholdToken).id
  tokenThreshold.min = event.params.min
  tokenThreshold.max = event.params.max
  tokenThreshold.save()

  const customTokenThreshold = new CustomTokenThreshold(customTokenThresholdId)
  customTokenThreshold.taskConfig = taskConfig.id
  customTokenThreshold.token = loadOrCreateERC20(event.params.token).id
  customTokenThreshold.threshold = tokenThreshold.id
  customTokenThreshold.save()
}

export function handleCustomVolumeLimitSet(event: CustomVolumeLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const customVolumeLimitId = getTaskCustomConfigId(taskConfig, event.params.token)

  let volumeLimit = VolumeLimit.load(customVolumeLimitId)
  if (volumeLimit == null) volumeLimit = new VolumeLimit(customVolumeLimitId)
  volumeLimit.token = loadOrCreateERC20(event.params.limitToken).id
  volumeLimit.amount = event.params.amount
  volumeLimit.period = event.params.period
  volumeLimit.save()

  let customVolumeLimit = CustomVolumeLimit.load(customVolumeLimitId)
  if (customVolumeLimit == null) customVolumeLimit = new CustomVolumeLimit(customVolumeLimitId)
  customVolumeLimit.taskConfig = taskConfig.id
  customVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  customVolumeLimit.volumeLimit = volumeLimit.id
  customVolumeLimit.save()
}

export function handleDefaultDestinationChainSet(event: DefaultDestinationChainSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.defaultDestinationChain = event.params.defaultDestinationChain
  taskConfig.save()
}

export function handleDefaultMaxSlippageSet(event: DefaultMaxSlippageSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.defaultMaxSlippage = event.params.maxSlippage
  taskConfig.save()
}

export function handleDefaultTokenOutSet(event: DefaultTokenOutSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.defaultTokenOut = loadOrCreateERC20(event.params.tokenOut).id
  taskConfig.save()
}

export function handleDefaultVolumeLimitSet(event: DefaultVolumeLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  let defaultVolumeLimit = VolumeLimit.load(taskConfig.id)
  if (defaultVolumeLimit == null) defaultVolumeLimit = new VolumeLimit(taskConfig.id)
  defaultVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  defaultVolumeLimit.amount = event.params.amount
  defaultVolumeLimit.period = event.params.period
  defaultVolumeLimit.save()
}

export function handleDefaultTokenThresholdSet(event: DefaultTokenThresholdSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  let defaultTokenThreshold = TokenThreshold.load(taskConfig.id)
  if (defaultTokenThreshold == null) defaultTokenThreshold = new TokenThreshold(taskConfig.id)
  defaultTokenThreshold.token = loadOrCreateERC20(event.params.token).id
  defaultTokenThreshold.min = event.params.min
  defaultTokenThreshold.max = event.params.max
  defaultTokenThreshold.save()
}

export function handleGasPriceLimitSet(event: GasPriceLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.gasPriceLimit = event.params.gasPriceLimit
  taskConfig.save()
}

export function handlePaused(event: Paused): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.paused = true
  task.save
}

export function handlePriorityFeeLimitSet(event: PriorityFeeLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.priorityFeeLimit = event.params.priorityFeeLimit
  taskConfig.save()
}

export function handleRecipientSet(event: RecipientSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.recipient = event.params.recipient.toHexString()
  taskConfig.save()
}

export function handleTimeLockDelaySet(event: TimeLockDelaySet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.timeLockDelay = event.params.delay
  taskConfig.save()
}

export function handleTimeLockExecutionPeriodSet(event: TimeLockExecutionPeriodSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.timeLockExecutionPeriod = event.params.period
  taskConfig.save()
}

export function handleTimeLockExpirationSet(event: TimeLockExpirationSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.timeLockExpiration = event.params.expiration
  taskConfig.save()
}

export function handleTokensAcceptanceListSet(event: TokensAcceptanceListSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const acceptanceList = loadOrCreateAcceptanceList(taskConfig.id)
  const tokens = acceptanceList.tokens
  const token = loadOrCreateERC20(event.params.token).id
  const index = tokens.indexOf(token)
  if (token && index < 0) tokens.push(token)
  else if (token && index >= 0) tokens.splice(index, 1)
  acceptanceList.tokens = tokens
  acceptanceList.save()
}

export function handleTokensAcceptanceTypeSet(event: TokensAcceptanceTypeSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const acceptanceList = loadOrCreateAcceptanceList(taskConfig.id)
  acceptanceList.type = parseAcceptanceType(event.params.acceptanceType)
  acceptanceList.save()
}

export function handleTxCostLimitPctSet(event: TxCostLimitPctSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.txCostLimitPct = event.params.txCostLimitPct
  taskConfig.save()
}

export function handleTxCostLimitSet(event: TxCostLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.txCostLimit = event.params.txCostLimit
  taskConfig.save()
}

export function handleUnpaused(event: Unpaused): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.paused = false
  task.save
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

export function loadOrCreateTaskConfig(taskId: string): TaskConfig {
  let taskConfig = TaskConfig.load(taskId)

  if (taskConfig === null) {
    taskConfig = new TaskConfig(taskId)
    taskConfig.task = taskId
    taskConfig.acceptanceList = loadOrCreateAcceptanceList(taskId).id
    taskConfig.previousBalanceConnector = '0x0000000000000000000000000000000000000000000000000000000000000000'
    taskConfig.nextBalanceConnector = '0x0000000000000000000000000000000000000000000000000000000000000000'
    taskConfig.gasPriceLimit = BigInt.zero()
    taskConfig.priorityFeeLimit = BigInt.zero()
    taskConfig.txCostLimitPct = BigInt.zero()
    taskConfig.txCostLimit = BigInt.zero()
    taskConfig.timeLockDelay = BigInt.zero()
    taskConfig.timeLockExecutionPeriod = BigInt.zero()
    taskConfig.timeLockExpiration = BigInt.zero()
    taskConfig.save()
  }

  return taskConfig
}

export function loadOrCreateAcceptanceList(tokensAcceptanceListId: string): AcceptanceList {
  let acceptanceList = AcceptanceList.load(tokensAcceptanceListId)

  if (acceptanceList === null) {
    acceptanceList = new AcceptanceList(tokensAcceptanceListId)
    acceptanceList.taskConfig = tokensAcceptanceListId
    acceptanceList.type = 'DenyList'
    acceptanceList.tokens = []
  }

  return acceptanceList
}

export function parseAcceptanceType(op: i32): string {
  if (op == 0) return 'DenyList'
  else return 'AllowList'
}

export function getTaskCustomConfigId(taskConfig: TaskConfig, token: Address): string {
  return taskConfig.id.toString() + '/' + token.toHexString()
}
