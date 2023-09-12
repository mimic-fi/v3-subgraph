import { Address, BigInt, Bytes, crypto, log } from '@graphprotocol/graph-ts'

import { AuthorizerDeployed, PriceOracleDeployed, SmartVaultDeployed, TaskDeployed } from '../types/Deployer/Deployer'
import { Authorizer, BaseSwapTask, Environment, PriceOracle, SmartVault, Task } from '../types/schema'
import {
  Authorizer as AuthorizerTemplate,
  BaseSwapTask as BaseSwapTaskTemplate,
  PriceOracle as PriceOracleTemplate,
  SmartVault as SmartVaultTemplate,
  Task as TaskTemplate,
} from '../types/templates'
import { loadOrCreateERC20 } from './ERC20'
import { getNetworkName } from './Networks'
import { loadOrCreateImplementation } from './Registry'
import { getAuthorizer, getPriceOracle, getRegistry } from './SmartVault'
import { getExecutionType, getSmartVault, getTokensSource, loadOrCreateAcceptanceList } from './Task'

export function handleAuthorizerDeployed(event: AuthorizerDeployed): void {
  log.warning('New authorizer deployed {}', [event.params.instance.toHexString()])
  const implementation = loadOrCreateImplementation(event.params.implementation)
  const environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  const authorizerId = event.params.instance.toHexString()
  const authorizer = new Authorizer(authorizerId)
  authorizer.name = event.params.name
  authorizer.implementation = implementation.id
  authorizer.environment = environment.id
  authorizer.save()

  AuthorizerTemplate.create(event.params.instance)
}

export function handlePriceOracleDeployed(event: PriceOracleDeployed): void {
  log.warning('New price oracle deployed {}', [event.params.instance.toHexString()])
  const implementation = loadOrCreateImplementation(event.params.implementation)
  const environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  const priceOracleId = event.params.instance.toHexString()
  const priceOracle = new PriceOracle(priceOracleId)
  priceOracle.name = event.params.name
  priceOracle.implementation = implementation.id
  priceOracle.environment = environment.id
  priceOracle.save()

  PriceOracleTemplate.create(event.params.instance)
}

export function handleSmartVaultDeployed(event: SmartVaultDeployed): void {
  log.warning('New smart vault deployed {}', [event.params.instance.toHexString()])
  const implementation = loadOrCreateImplementation(event.params.implementation)
  const environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  const smartVaultId = event.params.instance.toHexString()
  const smartVault = new SmartVault(smartVaultId)
  smartVault.name = event.params.name
  smartVault.implementation = implementation.id
  smartVault.environment = environment.id
  smartVault.registry = getRegistry(event.params.instance).toHexString()
  smartVault.authorizer = getAuthorizer(event.params.instance).toHexString()
  smartVault.priceOracle = getPriceOracle(event.params.instance).toHexString()
  smartVault.paused = false
  smartVault.save()

  SmartVaultTemplate.create(event.params.instance)
}

export function handleTaskDeployed(event: TaskDeployed): void {
  log.warning('New task deployed {}', [event.params.instance.toHexString()])
  const implementation = loadOrCreateImplementation(event.params.implementation)
  const environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  const taskId = event.params.instance.toHexString()
  const task = new Task(taskId)
  task.name = event.params.name
  task.implementation = implementation.id
  task.environment = environment.id
  task.smartVault = getSmartVault(event.params.instance).toHexString()
  task.tokensSource = getTokensSource(event.params.instance).toHexString()
  task.previousBalanceConnector = '0x0000000000000000000000000000000000000000000000000000000000000000'
  task.nextBalanceConnector = '0x0000000000000000000000000000000000000000000000000000000000000000'
  task.executionType = getExecutionType(event.params.instance).toHexString()
  task.gasPriceLimit = BigInt.zero()
  task.priorityFeeLimit = BigInt.zero()
  task.txCostLimitPct = BigInt.zero()
  task.txCostLimit = BigInt.zero()
  task.timeLockDelay = BigInt.zero()
  task.timeLockExecutionPeriod = BigInt.zero()
  task.timeLockExpiration = BigInt.zero()
  task.acceptanceList = loadOrCreateAcceptanceList(taskId).id
  task.save()

  if (isSwapTask(task.executionType)) {
    const baseSwapTask = new BaseSwapTask(taskId)
    baseSwapTask.connector = '0x0000000000000000000000000000000000000000000000000000000000000000'
    baseSwapTask.defaultSlippage = BigInt.zero()
    baseSwapTask.defaultTokenOut = loadOrCreateERC20(event.address).id
    BaseSwapTaskTemplate.create(event.params.instance)
  } else {
    TaskTemplate.create(event.params.instance)
  }
}

export function loadOrCreateEnvironment(creator: Address, namespace: string): Environment {
  const rawId = Bytes.fromHexString(creator.toHexString() + Bytes.fromUTF8(namespace.toString()).toHexString().slice(2))
  const id = crypto.keccak256(rawId).toHexString()
  let environment = Environment.load(id)

  if (environment === null) {
    environment = new Environment(id)
    environment.creator = creator.toHexString()
    environment.namespace = namespace
    environment.network = getNetworkName()
    environment.save()
  }

  return environment
}

function isSwapTask(taskType: string): boolean {
  const swapTaskTypes = [
    '0xb04abccc9a3bcbe96536610c6bcb56b2f9ec1e9af548139a186f11f31f0e7121', //HOP_L2_SWAPPER
    '0xb2fb51634eee8eefc9062327c30104c1e44eefaa7b362db57982bcc575abeaf8', //1INCH_V5_SWAPPER
    '0x2aa55357cb8e1cd896f09f21ca5abbf0adf8e40e84efd87c4e402514be3c15ff', //PARASWAP_V5_SWAPPER
    '0xf256196938420b115ce58753092f939505c868b71e9fe939f29c8b0e81268af6', //UNISWAP_V2_SWAPPER
    '0x786e6ab94efb5bc7ef1115d1eacf8e0277e0f6954215299c7bb62360d4271aff', //UNISWAP_V3_SWAPPER
  ]

  return swapTaskTypes.includes(taskType)
}
