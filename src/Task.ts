import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import {
  AcceptanceList,
  CustomDestinationChain,
  CustomMaxBridgeFee,
  CustomMaxSlippage,
  CustomTokenOut,
  CustomTokenThreshold,
  CustomVolumeLimit,
  GasLimits,
  MaxBridgeFee,
  Task,
  TaskConfig,
  TimeLock,
  TokenThreshold,
  VolumeLimit,
} from '../types/schema'
import {
  BalanceConnectorsSet,
  ConnectorSet,
  CustomDestinationChainSet,
  CustomMaxFeeSet,
  CustomMaxSlippageSet,
  CustomTokenOutSet,
  CustomTokenThresholdSet,
  CustomVolumeLimitSet,
  DefaultDestinationChainSet,
  DefaultMaxFeeSet,
  DefaultMaxSlippageSet,
  DefaultTokenOutSet,
  DefaultTokenThresholdSet,
  DefaultVolumeLimitSet,
  GasLimitsSet,
  GasPriceLimitSet,
  Paused,
  PriorityFeeLimitSet,
  RecipientSet,
  Task as TaskContract,
  TimeLockAllowedAtSet,
  TimeLockSet,
  TokensAcceptanceListSet,
  TokensAcceptanceTypeSet,
  TxCostLimitPctSet,
  TxCostLimitSet,
  Unpaused,
} from '../types/templates/Task/Task'
import { loadOrCreateERC20 } from './ERC20'

export function handlePaused(event: Paused): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.paused = true
  task.save()
}

export function handleUnpaused(event: Unpaused): void {
  const task = Task.load(event.address.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.address.toHexString()])

  task.paused = false
  task.save()
}

export function handleBalanceConnectorsSet(event: BalanceConnectorsSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.previousBalanceConnector = event.params.previous.toHexString()
  taskConfig.nextBalanceConnector = event.params.next.toHexString()
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

  taskConfig.acceptanceList = acceptanceList.id
  taskConfig.save()
}

export function handleGasLimitsSet(event: GasLimitsSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const gasLimits = loadOrCreateGasLimits(taskConfig.id)
  gasLimits.gasPriceLimit = event.params.gasPriceLimit
  gasLimits.priorityFeeLimit = event.params.priorityFeeLimit
  gasLimits.txCostLimitPct = event.params.txCostLimitPct
  gasLimits.txCostLimit = event.params.txCostLimit
  gasLimits.save()

  taskConfig.gasLimits = gasLimits.id
  taskConfig.save()
}

export function handleGasPriceLimitSet(event: GasPriceLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const gasLimits = loadOrCreateGasLimits(taskConfig.id)
  gasLimits.gasPriceLimit = event.params.gasPriceLimit
  gasLimits.save()

  taskConfig.gasLimits = gasLimits.id
  taskConfig.save()
}

export function handlePriorityFeeLimitSet(event: PriorityFeeLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const gasLimits = loadOrCreateGasLimits(taskConfig.id)
  gasLimits.priorityFeeLimit = event.params.priorityFeeLimit
  gasLimits.save()

  taskConfig.gasLimits = gasLimits.id
  taskConfig.save()
}

export function handleTxCostLimitPctSet(event: TxCostLimitPctSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const gasLimits = loadOrCreateGasLimits(taskConfig.id)
  gasLimits.txCostLimitPct = event.params.txCostLimitPct
  gasLimits.save()

  taskConfig.gasLimits = gasLimits.id
  taskConfig.save()
}

export function handleTxCostLimitSet(event: TxCostLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const gasLimits = loadOrCreateGasLimits(taskConfig.id)
  gasLimits.txCostLimit = event.params.txCostLimit
  gasLimits.save()

  taskConfig.gasLimits = gasLimits.id
  taskConfig.save()
}

export function handleTimeLockSet(event: TimeLockSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const timeLock = loadOrCreateTimeLock(taskConfig.id)
  timeLock.mode = parseTimeLockMode(event.params.mode)
  timeLock.frequency = event.params.frequency
  timeLock.allowedAt = event.params.allowedAt
  timeLock.window = event.params.window
  timeLock.save()

  taskConfig.timeLock = timeLock.id
  taskConfig.save()
}

export function handleTimeLockAllowedAtSet(event: TimeLockAllowedAtSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const timeLock = loadOrCreateTimeLock(taskConfig.id)
  timeLock.allowedAt = event.params.allowedAt
  timeLock.save()

  taskConfig.timeLock = timeLock.id
  taskConfig.save()
}

export function handleConnectorSet(event: ConnectorSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.connector = event.params.connector.toHexString()
  taskConfig.save()
}

export function handleRecipientSet(event: RecipientSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.recipient = event.params.recipient.toHexString()
  taskConfig.save()
}

export function handleDefaultTokenThresholdSet(event: DefaultTokenThresholdSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  let defaultTokenThreshold = TokenThreshold.load(taskConfig.id)
  if (defaultTokenThreshold == null) defaultTokenThreshold = new TokenThreshold(taskConfig.id)
  defaultTokenThreshold.token = loadOrCreateERC20(event.params.token).id
  defaultTokenThreshold.min = event.params.min
  defaultTokenThreshold.max = event.params.max
  defaultTokenThreshold.save()

  taskConfig.defaultTokenThreshold = defaultTokenThreshold.id
  taskConfig.save()
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

export function handleDefaultVolumeLimitSet(event: DefaultVolumeLimitSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  let defaultVolumeLimit = VolumeLimit.load(taskConfig.id)
  if (defaultVolumeLimit == null) defaultVolumeLimit = new VolumeLimit(taskConfig.id)
  defaultVolumeLimit.token = loadOrCreateERC20(event.params.token).id
  defaultVolumeLimit.amount = event.params.amount
  defaultVolumeLimit.period = event.params.period
  defaultVolumeLimit.save()

  taskConfig.defaultVolumeLimit = defaultVolumeLimit.id
  taskConfig.save()
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

export function handleDefaultTokenOutSet(event: DefaultTokenOutSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.defaultTokenOut = loadOrCreateERC20(event.params.tokenOut).id
  taskConfig.save()
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

export function handleDefaultMaxSlippageSet(event: DefaultMaxSlippageSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.defaultMaxSlippage = event.params.maxSlippage
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

export function handleDefaultDestinationChainSet(event: DefaultDestinationChainSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  taskConfig.defaultDestinationChain = event.params.defaultDestinationChain
  taskConfig.save()
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

export function handleDefaultMaxFeeSet(event: DefaultMaxFeeSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  let defaultMaxBridgeFee = MaxBridgeFee.load(taskConfig.id)
  if (defaultMaxBridgeFee == null) defaultMaxBridgeFee = new MaxBridgeFee(taskConfig.id)
  defaultMaxBridgeFee.amount = event.params.amount
  defaultMaxBridgeFee.token = loadOrCreateERC20(event.params.maxFeeToken).id
  defaultMaxBridgeFee.save()

  taskConfig.defaultMaxBridgeFee = defaultMaxBridgeFee.id
  taskConfig.save()
}

export function handleCustomMaxFeeSet(event: CustomMaxFeeSet): void {
  const taskConfig = loadOrCreateTaskConfig(event.address.toHexString())
  const customMaxBridgeFeeId = getTaskCustomConfigId(taskConfig, event.params.token)

  let maxBridgeFee = MaxBridgeFee.load(customMaxBridgeFeeId)
  if (maxBridgeFee == null) maxBridgeFee = new MaxBridgeFee(customMaxBridgeFeeId)
  maxBridgeFee.amount = event.params.amount
  maxBridgeFee.token = loadOrCreateERC20(event.params.maxFeeToken).id
  maxBridgeFee.save()

  let customMaxBridgeFee = CustomMaxBridgeFee.load(customMaxBridgeFeeId)
  if (customMaxBridgeFee === null) customMaxBridgeFee = new CustomMaxBridgeFee(customMaxBridgeFeeId)
  customMaxBridgeFee.taskConfig = taskConfig.id
  customMaxBridgeFee.token = loadOrCreateERC20(event.params.token).id
  customMaxBridgeFee.maxBridgeFee = maxBridgeFee.id
  customMaxBridgeFee.save()
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

export function loadOrCreateGasLimits(gasPriceLimitsId: string): GasLimits {
  let gasLimits = GasLimits.load(gasPriceLimitsId)

  if (gasLimits === null) {
    gasLimits = new GasLimits(gasPriceLimitsId)
    gasLimits.taskConfig = gasPriceLimitsId
    gasLimits.gasPriceLimit = BigInt.zero()
    gasLimits.priorityFeeLimit = BigInt.zero()
    gasLimits.txCostLimitPct = BigInt.zero()
    gasLimits.txCostLimit = BigInt.zero()
    gasLimits.save()
  }

  return gasLimits
}

export function loadOrCreateTimeLock(timeLockId: string): TimeLock {
  let timeLock = TimeLock.load(timeLockId)

  if (timeLock === null) {
    timeLock = new TimeLock(timeLockId)
    timeLock.taskConfig = timeLockId
    timeLock.mode = 'Seconds'
    timeLock.allowedAt = BigInt.zero()
    timeLock.frequency = BigInt.zero()
    timeLock.window = BigInt.zero()
    timeLock.save()
  }

  return timeLock
}

export function parseAcceptanceType(op: i32): string {
  if (op == 0) return 'DenyList'
  else return 'AllowList'
}

export function parseTimeLockMode(mode: i32): string {
  if (mode == 0) return 'Seconds'
  if (mode == 1) return 'OnDay'
  if (mode == 2) return 'LastMonthDay'
  else return 'Unknown'
}

export function getTaskCustomConfigId(taskConfig: TaskConfig, token: Address): string {
  return taskConfig.id.toString() + '/' + token.toHexString()
}
