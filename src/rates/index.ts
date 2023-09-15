import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { getERC20Decimals, getERC20Symbol } from '../ERC20'
import { isArbitrum, isAvalanche, isBinance, isFantom, isGnosis, isMainnet, isOptimism, isPolygon } from '../Networks'
import { getUsdc } from './Tokens'
import { rateInUsdc as rateInUsdcInUniV2 } from './UniswapV2'
import { rateInUsdc as rateInUsdcInUniV3 } from './UniswapV3'

const DECIMALS = 6 as u8
/* eslint-disable no-secrets/no-secrets */
const SUSHISWAP_FACTORY = Address.fromString('0xc35dadb65012ec5796536bd9864ed8773abc74c4')
const HONEYSWAP_FACTORY = Address.fromString('0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7')

export function rateInUsd(token: Address, amount: BigInt): BigInt {
  const amountInUsdc = rateInUsdc(token, amount)
  if (amountInUsdc.isZero()) return BigInt.zero()

  const decimals = getERC20Decimals(getUsdc()) as u8
  if (decimals == DECIMALS) return amountInUsdc
  else if (decimals >= DECIMALS) return amountInUsdc.div(BigInt.fromI32(10).pow(decimals - DECIMALS))
  else return amountInUsdc.times(BigInt.fromI32(10).pow(DECIMALS - decimals))
}

function rateInUsdc(token: Address, amount: BigInt): BigInt {
  if (isMainnet() || isPolygon() || isOptimism() || isArbitrum()) return rateInUsdcInUniV3(token, amount)
  if (isFantom() || isAvalanche() || isBinance()) return rateInUsdcInUniV2(token, amount, SUSHISWAP_FACTORY)
  if (isGnosis()) return rateInUsdcInUniV2(token, amount, HONEYSWAP_FACTORY)

  const symbol = getERC20Symbol(token)
  log.warning('Could not compute rate in USD for token {} ({})', [symbol, token.toHexString()])

  return BigInt.zero()
}
