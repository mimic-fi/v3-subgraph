import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import {
  FeeCollectorSet,
  FeeController,
  FeePercentageSet,
  MaxFeePercentageSet,
} from '../types/FeeController/FeeController'
import { SmartVaultFee } from '../types/schema'

export function handleFeeCollectorSet(event: FeeCollectorSet): void {
  const smartVaultFee = loadOrCreateSmartVaultFee(event.params.smartVault.toHexString(), event.address)
  let feeCollector = event.params.collector.toHexString()
  feeCollector = event.params.collector.equals(Address.zero()) ? getDefaultFeeCollector(event.address) : feeCollector
  smartVaultFee.feeCollector = feeCollector
  smartVaultFee.save()
}

export function handleFeePercentageSet(event: FeePercentageSet): void {
  const smartVaultFee = loadOrCreateSmartVaultFee(event.params.smartVault.toHexString(), event.address)
  smartVaultFee.maxFeePercentage = event.params.pct
  smartVaultFee.save()
}

export function handleMaxFeePercentageSet(event: MaxFeePercentageSet): void {
  const smartVaultFee = loadOrCreateSmartVaultFee(event.params.smartVault.toHexString(), event.address)
  smartVaultFee.maxFeePercentage = event.params.maxPct
  smartVaultFee.save()
}

function getDefaultFeeCollector(address: Address): string {
  const contract = FeeController.bind(address)
  const feeControllerCall = contract.try_defaultFeeCollector()
  if (!feeControllerCall.reverted) {
    return feeControllerCall.value.toHexString()
  }

  log.warning('feeController() call reverted for {}', [address.toHexString()])
  return 'Unknown'
}

export function loadOrCreateSmartVaultFee(smartVaultFeeId: string, address: Address): SmartVaultFee {
  let smartVaultFee = SmartVaultFee.load(address.toHexString())

  if (smartVaultFee == null) {
    smartVaultFee = new SmartVaultFee(smartVaultFeeId)
    smartVaultFee.smartVault = smartVaultFeeId
    smartVaultFee.feeCollector = getDefaultFeeCollector(address)
    smartVaultFee.feePercentage = BigInt.zero()
    smartVaultFee.maxFeePercentage = BigInt.zero()
    smartVaultFee.save()
  }
  return smartVaultFee
}
