import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { UniswapFactoryV2 as UniswapFactory } from '../../types/templates/SmartVault/UniswapFactoryV2'
import { UniswapPairV2 as UniswapPair } from '../../types/templates/SmartVault/UniswapPairV2'
import { getUsdc, getWrappedNativeToken } from './Tokens'

const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

export function rateInUsdc(token: Address, amount: BigInt, factoryAddress: Address): BigInt {
  const USDC = getUsdc()
  const wrappedNativeToken = getWrappedNativeToken()
  const factory = UniswapFactory.bind(factoryAddress)

  if (token.equals(USDC)) return amount
  if (token.equals(wrappedNativeToken)) return convert(factory, wrappedNativeToken, USDC, amount)
  return convert(factory, wrappedNativeToken, USDC, convert(factory, token, wrappedNativeToken, amount))
}

function convert(factory: UniswapFactory, tokenIn: Address, tokenOut: Address, amountIn: BigInt): BigInt {
  if (amountIn.isZero()) return BigInt.zero()

  const poolAddress = getPool(factory, tokenIn, tokenOut)
  if (poolAddress.equals(ZERO_ADDRESS)) {
    log.warning('Could not find pool for tokens {} and {}', [tokenIn.toHexString(), tokenOut.toHexString()])
    return BigInt.zero()
  }

  const reserves = getReserves(poolAddress)
  const isTokenInLtTokenOut = tokenIn.toHexString().toLowerCase() < tokenOut.toHexString().toLowerCase()
  const tokenInReserve = isTokenInLtTokenOut ? reserves[0] : reserves[1]
  const tokenOutReserve = isTokenInLtTokenOut ? reserves[1] : reserves[0]
  return amountIn.times(tokenOutReserve).div(tokenInReserve)
}

function getReserves(address: Address): Array<BigInt> {
  const pool = UniswapPair.bind(address)
  const reservesCall = pool.try_getReserves()

  if (!reservesCall.reverted) {
    return [reservesCall.value.value0, reservesCall.value.value1]
  }

  log.warning('getReserves() call reverted for {}', [address.toHexString()])
  return [BigInt.zero(), BigInt.zero()]
}

function getPool(factory: UniswapFactory, tokenA: Address, tokenB: Address): Address {
  const pairCall = factory.try_getPair(tokenA, tokenB)

  if (!pairCall.reverted) {
    return pairCall.value
  }

  log.warning('getPair() call reverted for tokens {} {}', [tokenA.toHexString(), tokenB.toHexString()])
  return ZERO_ADDRESS
}
