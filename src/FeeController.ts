import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { SmartVault, SmartVaultFee } from '../types/schema'
import {
  DefaultFeeCollectorSet,
  FeeCollectorSet,
  FeePercentageSet,
  MaxFeePercentageSet,
} from '../types/templates/FeeController/FeeController'
import { SmartVault as SmartVaultContract } from '../types/templates/SmartVault/SmartVault'

export function handleDefaultFeeCollectorSet(event: DefaultFeeCollectorSet): void {
  const smartVault = getSmartVault(event.address)

  const feeController = loadOrCreateSmartVaultFee(smartVault.toHexString(), event.address)
  feeController.feeCollector = event.params.collector.toHexString()
  feeController.save()
}

export function handleFeeCollectorSet(event: FeeCollectorSet): void {
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smartVault entity {}', [event.params.smartVault.toHexString()])

  const feeController = loadOrCreateSmartVaultFee(smartVault.id, event.address)
  let feeCollector = event.params.collector.toHexString()
  feeCollector = Address.zero().toHexString() ? getFeeCollector(event.address) : feeCollector
  feeController.feeCollector = feeCollector
  feeController.save()
}

export function handleFeePercentageSet(event: FeePercentageSet): void {
  const smartVault = getSmartVault(event.address)

  const feeController = loadOrCreateSmartVaultFee(smartVault.toHexString(), event.address)
  feeController.maxFeePercentage = event.params.pct
  feeController.save()
}

export function handleMaxFeePercentageSet(event: MaxFeePercentageSet): void {
  const smartVault = getSmartVault(event.address)

  const feeController = loadOrCreateSmartVaultFee(smartVault.toHexString(), event.address)
  feeController.maxFeePercentage = event.params.maxPct
  feeController.save()
}

function getFeeCollector(address: Address): string {
  return '0x000000'
  // let contract = SmartVaultContract.bind(address)
  // // TODO: Analize the values that should be passed
  // let feeCollectorCall = contract.try_getBalanceConnector()
  // if (!feeCollectorCall.reverted) {
  //   return feeCollectorCall.value.toHexString()
  // }

  // log.warning('feeCollector() call reverted for {}', [address.toHexString()])
  // return 'Unknown'
}

export function getSmartVault(address: Address): Address {
  const taskContract = SmartVaultContract.bind(address)
  if (taskContract == null) {
    log.warning('SmartVault missing {}', [address.toHexString()])
    throw Error('Could not find SmartVault')
  }
  return taskContract._address
}

export function loadOrCreateSmartVaultFee(feeCollectorId: string, address: Address): SmartVaultFee {
  let feeController = SmartVaultFee.load(feeCollectorId)

  if (feeController == null) {
    feeController = new SmartVaultFee(feeCollectorId)
    feeController.smartVault = feeCollectorId
    feeController.feeCollector = getFeeCollector(address)
    feeController.feePercentage = BigInt.zero()
    feeController.maxFeePercentage = BigInt.zero()
    feeController.save()
  }
  return feeController
}
