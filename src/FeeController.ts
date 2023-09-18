import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import {
  FeeCollectorSet,
  FeeController,
  FeePercentageSet,
  MaxFeePercentageSet,
} from '../types/FeeController/FeeController'
import { SmartVault, SmartVaultFee } from '../types/schema'

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
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smartVault entity {}', [event.params.smartVault.toHexString()])

  const feeController = loadOrCreateSmartVaultFee(smartVault.id, event.address)
  feeController.maxFeePercentage = event.params.pct
  feeController.save()
}

export function handleMaxFeePercentageSet(event: MaxFeePercentageSet): void {
  const smartVault = SmartVault.load(event.params.smartVault.toHexString())
  if (smartVault == null) return log.warning('Missing smartVault entity {}', [event.params.smartVault.toHexString()])

  const feeController = loadOrCreateSmartVaultFee(smartVault.id, event.address)
  feeController.maxFeePercentage = event.params.maxPct
  feeController.save()
}

function getFeeCollector(address: Address): string {
  const contract = FeeController.bind(address)
  const feeControllerCall = contract.try_defaultFeeCollector()
  if (!feeControllerCall.reverted) {
    return feeControllerCall.value.toHexString()
  }

  log.warning('feeController() call reverted for {}', [address.toHexString()])
  return 'Unkonwn'
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
