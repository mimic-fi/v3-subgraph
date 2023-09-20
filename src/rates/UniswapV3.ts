import { Address, BigInt, log } from '@graphprotocol/graph-ts'

import { UniswapFactoryV3 as UniswapFactory } from '../../types/templates/SmartVault/UniswapFactoryV3'
import { UniswapPoolV3 as UniswapPool } from '../../types/templates/SmartVault/UniswapPoolV3'
import { UniswapRouterV3 as UniswapRouter } from '../../types/templates/SmartVault/UniswapRouterV3'
import { getUsdc, getWrappedNativeToken } from './Tokens'

const POW_2_192 = BigInt.fromI32(2).pow(192)
const ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')

/* eslint-disable no-secrets/no-secrets */

export const UNISWAP_V3_ROUTER = Address.fromString('0xE592427A0AEce92De3Edee1F18E0157C05861564')

export function rateInUsdc(token: Address, amount: BigInt): BigInt {
  const USDC = getUsdc()
  const wrappedNativeToken = getWrappedNativeToken()

  if (token.equals(USDC)) return amount
  if (token.equals(wrappedNativeToken)) return convert(wrappedNativeToken, USDC, amount)
  return convert(wrappedNativeToken, USDC, convert(token, wrappedNativeToken, amount))
}

function convert(tokenIn: Address, tokenOut: Address, amountIn: BigInt): BigInt {
  if (amountIn.isZero()) return BigInt.zero()

  const pool = getLowestFeePool(tokenIn, tokenOut)
  if (pool.equals(ZERO_ADDRESS)) {
    log.warning('Could not find pool for tokens {} and {}', [tokenIn.toHexString(), tokenOut.toHexString()])
    return BigInt.zero()
  }

  // sqrtPriceX96 is the sqrt price between token0/token1 expressed in Q64.96
  // therefore, the price can be computed as: sqrtPriceX96 ** 2 / 2 ** 192

  const sqrtPriceX96 = getSqrtPriceX96(pool)
  // price = sqrtPriceX96.times(sqrtPriceX96).div(POW_2_192)

  // To avoid losing precision we do:
  if (tokenIn.toHexString().toLowerCase() < tokenOut.toHexString().toLowerCase()) {
    // tokenIn is token0 => amountIn * price
    return amountIn.times(sqrtPriceX96).times(sqrtPriceX96).div(POW_2_192)
  } else {
    // tokenOut is token0 => amountIn / price
    return amountIn.times(POW_2_192).div(sqrtPriceX96).div(sqrtPriceX96)
  }
}

function getSqrtPriceX96(address: Address): BigInt {
  const pool = UniswapPool.bind(address)
  const slot0Call = pool.try_slot0()

  if (!slot0Call.reverted) {
    return slot0Call.value.value0
  }

  log.warning('slot0() call reverted for pool {}', [address.toHexString()])
  return BigInt.zero()
}

function getLowestFeePool(tokenA: Address, tokenB: Address): Address {
  const pool500 = getPool(tokenA, tokenB, 500)
  if (!pool500.equals(ZERO_ADDRESS)) return pool500

  const pool3000 = getPool(tokenA, tokenB, 3000)
  if (!pool3000.equals(ZERO_ADDRESS)) return pool3000

  const pool10000 = getPool(tokenA, tokenB, 10000)
  if (!pool10000.equals(ZERO_ADDRESS)) return pool10000

  log.warning('Could not find pool for tokens {} and {}', [tokenA.toHexString(), tokenB.toHexString()])
  return ZERO_ADDRESS
}

function getPool(tokenA: Address, tokenB: Address, fee: i32): Address {
  const factory = UniswapFactory.bind(getFactory())
  const poolCall = factory.try_getPool(tokenA, tokenB, fee)

  if (!poolCall.reverted) {
    return poolCall.value
  }

  const params = [tokenA.toHexString(), tokenB.toHexString(), fee.toString()]
  log.warning('getPool() call reverted for tokens {} {} and fee {}', params)
  return ZERO_ADDRESS
}

function getFactory(): Address {
  const router = UniswapRouter.bind(UNISWAP_V3_ROUTER)
  const factoryCall = router.try_factory()

  if (!factoryCall.reverted) {
    return factoryCall.value
  }

  log.warning('factory() call reverted for Uniswap V3 router {}', [UNISWAP_V3_ROUTER.toHexString()])
  return ZERO_ADDRESS
}
