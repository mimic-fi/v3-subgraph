import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Deprecated, Registered } from '../types/Registry/Registry'
import { Implementation, Task, VolumeLimit } from '../types/schema'

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

export function loadOrCreateVolumeLimit(task: Task, tokenAddress: Address): string {
  const volumeLimitId = task.id
  let volumeLimit = VolumeLimit.load(volumeLimitId)

  if (volumeLimit === null) {
    volumeLimit = new VolumeLimit(volumeLimitId)
    volumeLimit.task = task.id
    volumeLimit.token = tokenAddress.toHexString()
    volumeLimit.period = BigInt.zero()
    volumeLimit.amount = BigInt.zero()
    volumeLimit.save()
  }

  return volumeLimit.id
}
