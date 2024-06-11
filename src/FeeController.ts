import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
  DefaultFeeCollectorSet,
  FeeCollectorSet,
  FeePercentageSet,
  MaxFeePercentageSet,
} from '../types/FeeController/FeeController'
import { FeeController, SmartVaultFee } from '../types/schema'

export function handleFeeCollectorSet(event: FeeCollectorSet): void {
  const smartVaultFee = loadOrCreateSmartVaultFee(event.params.smartVault.toHexString(), event.address)
  const feeCollector = event.params.collector.toHexString()
  smartVaultFee.feeCollector = feeCollector
  smartVaultFee.save()
}

export function handleDefaultFeeCollectorSet(event: DefaultFeeCollectorSet): void {
  const feeController = loadOrCreateFeeController(event.address)
  feeController.feeCollector = event.params.collector.toHexString()
  feeController.save()
}

export function handleFeePercentageSet(event: FeePercentageSet): void {
  const smartVaultFee = loadOrCreateSmartVaultFee(event.params.smartVault.toHexString(), event.address)
  smartVaultFee.feePercentage = event.params.pct
  smartVaultFee.save()
}

export function handleMaxFeePercentageSet(event: MaxFeePercentageSet): void {
  const smartVaultFee = loadOrCreateSmartVaultFee(event.params.smartVault.toHexString(), event.address)
  smartVaultFee.maxFeePercentage = event.params.maxPct
  smartVaultFee.save()
}

export function loadOrCreateSmartVaultFee(smartVaultFeeId: string, address: Address): SmartVaultFee {
  let smartVaultFee = SmartVaultFee.load(address.toHexString())

  if (smartVaultFee == null) {
    smartVaultFee = new SmartVaultFee(smartVaultFeeId)
    smartVaultFee.feeController = loadOrCreateFeeController(address).id
    smartVaultFee.smartVault = smartVaultFeeId
    smartVaultFee.feeCollector = Address.zero().toHexString()
    smartVaultFee.feePercentage = BigInt.zero()
    smartVaultFee.maxFeePercentage = BigInt.zero()
    smartVaultFee.save()
  }
  return smartVaultFee
}

export function loadOrCreateFeeController(address: Address): FeeController {
  let feeController = FeeController.load(address.toHexString())

  if (feeController === null) {
    feeController = new FeeController(address.toHexString())
    feeController.feeCollector = Address.zero().toHexString()
    feeController.save()
  }

  return feeController
}
