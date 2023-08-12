import { Address, Bytes, crypto, log } from '@graphprotocol/graph-ts'

import { Authorizer as AuthorizerTemplate } from '../types/templates'
import { Authorizer, Environment, PriceOracle, SmartVault, Task } from '../types/schema'
import { AuthorizerDeployed, PriceOracleDeployed, SmartVaultDeployed, TaskDeployed } from '../types/Deployer/Deployer'

import { getSmartVault } from './Task'
import { loadOrCreateImplementation } from './Registry'
import { getAuthorizer, getPriceOracle, getRegistry } from './SmartVault'

export function handleAuthorizerDeployed(event: AuthorizerDeployed): void {
  log.warning('New authorizer deployed {}', [event.params.instance.toHexString()])
  let implementation = loadOrCreateImplementation(event.params.implementation)
  let environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  let authorizerId = event.params.instance.toHexString()
  let authorizer = new Authorizer(authorizerId)
  authorizer.name = event.params.name
  authorizer.implementation = implementation.id
  authorizer.environment = environment.id
  authorizer.save()

  AuthorizerTemplate.create(event.params.instance)
}

export function handlePriceOracleDeployed(event: PriceOracleDeployed): void {
  log.warning('New price oracle deployed {}', [event.params.instance.toHexString()])
  let implementation = loadOrCreateImplementation(event.params.implementation)
  let environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  let priceOracleId = event.params.instance.toHexString()
  let priceOracle = new PriceOracle(priceOracleId)
  priceOracle.name = event.params.name
  priceOracle.implementation = implementation.id
  priceOracle.environment = environment.id
  priceOracle.save()
}

export function handleSmartVaultDeployed(event: SmartVaultDeployed): void {
  log.warning('New smart vault deployed {}', [event.params.instance.toHexString()])
  let implementation = loadOrCreateImplementation(event.params.implementation)
  let environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  let smartVaultId = event.params.instance.toHexString()
  let smartVault = new SmartVault(smartVaultId)
  smartVault.name = event.params.name
  smartVault.implementation = implementation.id
  smartVault.environment = environment.id
  smartVault.registry = getRegistry(event.params.instance).toHexString()
  smartVault.authorizer = getAuthorizer(event.params.instance).toHexString()
  smartVault.priceOracle = getPriceOracle(event.params.instance).toHexString()
  smartVault.save()
}

export function handleTaskDeployed(event: TaskDeployed): void {
  log.warning('New task deployed {}', [event.params.instance.toHexString()])
  let implementation = loadOrCreateImplementation(event.params.implementation)
  let environment = loadOrCreateEnvironment(event.transaction.from, event.params.namespace)

  let taskId = event.params.instance.toHexString()
  let task = new Task(taskId)
  task.name = event.params.name
  task.implementation = implementation.id
  task.environment = environment.id
  task.smartVault = getSmartVault(event.params.instance).toHexString()
  task.save()
}

export function loadOrCreateEnvironment(creator: Address, namespace: String): Environment {
  let rawId = Bytes.fromHexString(creator.toHexString() + Bytes.fromUTF8(namespace.toString()).toHexString().slice(2))
  let id = crypto.keccak256(rawId).toHexString()
  let environment = Environment.load(id)

  if (environment === null) {
    environment = new Environment(id)
    environment.creator = creator.toHexString()
    environment.namespace = namespace
    environment.save()
  }

  return environment
}
