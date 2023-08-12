import { Address, log } from '@graphprotocol/graph-ts'

import { Task as TaskContract } from '../types/templates/Task/Task'

export function getSmartVault(address: Address): Address {
  let taskContract = TaskContract.bind(address)
  let smartVaultCall = taskContract.try_smartVault()

  if (!smartVaultCall.reverted) {
    return smartVaultCall.value
  }

  log.warning('smartVault() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}
