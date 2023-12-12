import { Address, BigInt, log, store } from '@graphprotocol/graph-ts'

import { PriceOracleFeed, PriceOracleSigner } from '../types/schema'
import { AggregatorV3Interface } from '../types/templates/PriceOracle/AggregatorV3Interface'
import { FeedSet, SignerSet } from '../types/templates/PriceOracle/PriceOracle'
import { loadOrCreateERC20 } from './ERC20'
import {
  isArbitrum,
  isAvalanche,
  isBase,
  isBinance,
  isFantom,
  isGnosis,
  isMainnet,
  isOptimism,
  isPolygon,
} from './Networks'

/* eslint-disable no-secrets/no-secrets */

const PRECISION = 6 as u8

export function handleSignerSet(event: SignerSet): void {
  const signerId = event.address.toHexString() + '/signer/' + event.params.signer.toHexString()
  if (!event.params.allowed) return store.remove('PriceOracleSigner', signerId)

  let signer = PriceOracleSigner.load(signerId)
  if (signer == null) signer = new PriceOracleSigner(signerId)
  signer.signer = event.params.signer.toHexString()
  signer.priceOracle = event.address.toHexString()
  signer.save()
}

export function handleFeedSet(event: FeedSet): void {
  const baseQuote = event.params.base.toHexString() + '/' + event.params.quote.toHexString()
  const feedId = event.address.toHexString() + '/feed/' + baseQuote
  if (!event.params.feed.equals(Address.zero())) return store.remove('PriceOracleFeed', feedId)

  let feed = PriceOracleFeed.load(feedId)
  if (feed == null) feed = new PriceOracleFeed(feedId)
  feed.base = loadOrCreateERC20(event.params.base).id
  feed.quote = loadOrCreateERC20(event.params.quote).id
  feed.feed = event.params.feed.toHexString()
  feed.priceOracle = event.address.toHexString()
  feed.save()
}

export function rateNativeInUsd(amount: BigInt): BigInt {
  const feed = getNativeUsdFeed()
  if (feed.equals(Address.zero())) return BigInt.zero()

  const decimals = getFeedDecimals(feed)
  if (decimals == 0) return BigInt.zero()

  const price = getPrice(feed)
  if (price.isZero()) return BigInt.zero()

  const amountInUsd = price.times(amount)
  if (decimals == PRECISION) return amountInUsd
  else if (decimals >= PRECISION) return amountInUsd.div(BigInt.fromI32(10).pow(decimals - PRECISION))
  else return amountInUsd.times(BigInt.fromI32(10).pow(PRECISION - decimals))
}

function getNativeUsdFeed(): Address {
  if (isMainnet()) return Address.fromString('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419')
  if (isPolygon()) return Address.fromString('0xAB594600376Ec9fD91F8e885dADF0CE036862dE0')
  if (isOptimism()) return Address.fromString('0x13e3Ee699D1909E989722E753853AE30b17e08c5')
  if (isArbitrum()) return Address.fromString('0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612')
  if (isGnosis()) return Address.fromString('0x678df3415fc31947dA4324eC63212874be5a82f8')
  if (isAvalanche()) return Address.fromString('0x0A77230d17318075983913bC2145DB16C7366156')
  if (isBinance()) return Address.fromString('0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE')
  if (isFantom()) return Address.fromString('0xf4766552D15AE4d256Ad41B6cf2933482B0680dc')
  if (isBase()) return Address.fromString('0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70')
  return Address.zero()
}

function getPrice(feed: Address): BigInt {
  const contract = AggregatorV3Interface.bind(feed)
  const latestRoundDataCall = contract.try_latestRoundData()

  if (!latestRoundDataCall.reverted) {
    return latestRoundDataCall.value.value1
  }

  log.warning('latestRoundData() call reverted for {}', [feed.toHexString()])
  return BigInt.zero()
}

function getFeedDecimals(feed: Address): u8 {
  const contract = AggregatorV3Interface.bind(feed)
  const decimalsCall = contract.try_decimals()

  if (!decimalsCall.reverted) {
    return decimalsCall.value as u8
  }

  log.warning('decimals() call reverted for {}', [feed.toHexString()])
  return 0 as u8
}
