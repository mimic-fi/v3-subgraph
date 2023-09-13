import { log } from '@graphprotocol/graph-ts'

import { SmartVaultFee } from '../types/schema'
import {
  DefaultFeeCollectorSet,
  FeeCollectorSet,
  FeePercentageSet,
  MaxFeePercentageSet,
} from '../types/templates/FeeController/FeeController'

export function handleDefaultFeeCollectorSet(event: DefaultFeeCollectorSet): void {
  const feeController = SmartVaultFee.load(event.address.toHexString())
  if (feeController == null) return log.warning('Missing FeeController entity {}', [event.address.toHexString()])

  feeController.defaultFeeCollector = event.params.collector.toHexString()
  feeController.save()
}

export function handleFeeCollectorSet(event: FeeCollectorSet): void {
  const feeController = SmartVaultFee.load(event.params.smartVault.toHexString())
  if (feeController == null) return log.warning('Missing smartVault entity {}', [event.params.smartVault.toHexString()])

  feeController.customFeeColector = event.params.collector.toHexString()
  feeController.save()
}

export function handleFeePercentageSet(event: FeePercentageSet): void {
  const feeController = SmartVaultFee.load(event.address.toHexString())
  if (feeController == null) return log.warning('Missing FeeController entity {}', [event.address.toHexString()])

  feeController.maxFeePercentage = event.params.pct
  feeController.save()
}

export function handleMaxFeePercentageSet(event: MaxFeePercentageSet): void {
  const feeController = SmartVaultFee.load(event.address.toHexString())
  if (feeController == null) return log.warning('Missing FeeController entity {}', [event.address.toHexString()])

  feeController.maxFeePercentage = event.params.maxPct
  feeController.save()
}
