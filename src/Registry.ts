import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Deprecated, Registered } from '../types/Registry/Registry'
import { Implementation, Task, TokenThreshold } from '../types/schema'

export function handleRegistered(event: Registered): void {
  const implementation = loadOrCreateImplementation(event.params.implementation)
  implementation.name = event.params.name
  implementation.deprecated = false
  implementation.stateless = event.params.stateless
  implementation.save()
}

export function handleDeprecated(event: Deprecated): void {
  const implementation = loadOrCreateImplementation(event.params.implementation)
  implementation.deprecated = true
  implementation.save()
}

export function loadOrCreateImplementation(address: Address): Implementation {
  const id = address.toHexString()
  let implementation = Implementation.load(id)

  if (implementation === null) {
    implementation = new Implementation(id)
    implementation.name = ''
    implementation.stateless = false
    implementation.deprecated = false
    implementation.save()
  }

  return implementation
}

export function loadOrCreateDefaultTokenThreshold(task: Task, tokenAddress: Address): string {
  const tokenThresholdId = task.id
  let tokenThreshold = TokenThreshold.load(tokenThresholdId)

  if (tokenThreshold === null) {
    tokenThreshold = new TokenThreshold(tokenThresholdId)
    tokenThreshold.task = task.id
    tokenThreshold.token = tokenAddress.toHexString()
    tokenThreshold.min = BigInt.zero()
    tokenThreshold.max = BigInt.zero()
    tokenThreshold.save()
  }

  return tokenThreshold.id
}
