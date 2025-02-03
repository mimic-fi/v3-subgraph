import { BigInt, dataSource } from '@graphprotocol/graph-ts'

export function isEthNetwork(): boolean {
  return (
    isMainnet() ||
    isArbitrum() ||
    isOptimism() ||
    isBase() ||
    isZkEvm() ||
    isAurora() ||
    isSonic() ||
    isBlast() ||
    isMode()
  )
}

export function isMainnet(): boolean {
  return dataSource.network() == 'mainnet'
}

export function isArbitrum(): boolean {
  return dataSource.network() == 'arbitrum' || dataSource.network() == 'arbitrum-one'
}

export function isOptimism(): boolean {
  return dataSource.network() == 'optimism'
}

export function isPolygon(): boolean {
  return dataSource.network() == 'matic' || dataSource.network() == 'polygon'
}

export function isAvalanche(): boolean {
  return dataSource.network() == 'avalanche'
}

export function isBinance(): boolean {
  return dataSource.network() == 'bsc'
}

export function isFantom(): boolean {
  return dataSource.network() == 'fantom'
}

export function isGnosis(): boolean {
  return dataSource.network() == 'gnosis'
}

export function isBase(): boolean {
  return dataSource.network() == 'base'
}

export function isZkEvm(): boolean {
  return dataSource.network() == 'polygon-zkevm' || dataSource.network() == 'zkevm'
}

export function isAurora(): boolean {
  return dataSource.network() == 'aurora'
}

export function isSonic(): boolean {
  return dataSource.network() == 'sonic'
}

export function isBlast(): boolean {
  return dataSource.network() == 'blast'
}

export function isMode(): boolean {
  return dataSource.network() == 'mode'
}

export function getNetworkId(): BigInt {
  if (isMainnet()) return BigInt.fromI32(1)
  if (isArbitrum()) return BigInt.fromI32(42161)
  if (isOptimism()) return BigInt.fromI32(10)
  if (isPolygon()) return BigInt.fromI32(137)
  if (isAvalanche()) return BigInt.fromI32(43114)
  if (isBinance()) return BigInt.fromI32(56)
  if (isFantom()) return BigInt.fromI32(250)
  if (isGnosis()) return BigInt.fromI32(100)
  if (isZkEvm()) return BigInt.fromI32(1101)
  if (isBase()) return BigInt.fromI32(8453)
  if (isAurora()) return BigInt.fromI32(1313161554)
  if (isSonic()) return BigInt.fromI32(146)
  if (isBlast()) return BigInt.fromI32(81457)
  if (isMode()) return BigInt.fromI32(34443)
  return BigInt.fromI32(0)
}
