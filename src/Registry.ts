import { Implementation } from '../types/schema'
import { Deprecated, Registered } from '../types/Registry/Registry'
import { Address } from '@graphprotocol/graph-ts'

export function handleRegistered(event: Registered): void {
  let implementation = loadOrCreateImplementation(event.params.implementation)
  implementation.name = event.params.name
  implementation.deprecated = false
  implementation.stateless = event.params.stateless
  implementation.save()
}

export function handleDeprecated(event: Deprecated): void {
  let implementation = loadOrCreateImplementation(event.params.implementation)
  implementation.deprecated = true
  implementation.save()
}

export function loadOrCreateImplementation(address: Address): Implementation {
  let id = address.toHexString()
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
