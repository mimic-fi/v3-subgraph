import { Address, Bytes, crypto, log } from '@graphprotocol/graph-ts'

import { AuthorizerDeployed, PriceOracleDeployed, SmartVaultDeployed, TaskDeployed } from '../types/Deployer/Deployer'
import { Authorizer, Environment, PriceOracle, SmartVault, Task } from '../types/schema'
import {
  Authorizer as AuthorizerTemplate,
  PriceOracle as PriceOracleTemplate,
  SmartVault as SmartVaultTemplate,
  Task as TaskTemplate,
} from '../types/templates'
import { loadOrCreateNativeToken } from './ERC20'
import { getNetworkId } from './Networks'
import { loadOrCreateImplementation } from './Registry'
import { getAuthorizer, getPriceOracle, getRegistry } from './SmartVault'
import { getExecutionType, getSmartVault, getTokensSource } from './Task'

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
  smartVault.nativeToken = loadOrCreateNativeToken().id
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
  task.executionType = getExecutionType(event.params.instance).toHexString()
  task.save()

  TaskTemplate.create(event.params.instance)
}

export function loadOrCreateEnvironment(creator: Address, namespace: string): Environment {
  const rawId = Bytes.fromHexString(creator.toHexString() + Bytes.fromUTF8(namespace.toString()).toHexString().slice(2))
  const id = crypto.keccak256(rawId).toHexString()
  let environment = Environment.load(id)

  if (environment === null) {
    environment = new Environment(id)
    environment.creator = creator.toHexString()
    environment.namespace = namespace
    environment.network = getNetworkId()
    environment.save()
  }

  return environment
}
