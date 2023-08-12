import { Address, store } from '@graphprotocol/graph-ts'

import { PriceOracleFeed } from '../types/schema'
import { PriceOracleSigner } from '../types/schema'
import { FeedSet, SignerSet } from '../types/templates/PriceOracle/PriceOracle'

import { loadOrCreateERC20 } from './ERC20'

export function handleSignerSet(event: SignerSet): void {
  let signerId = event.address.toHexString() + '/signer/' + event.params.signer.toHexString()
  if (!event.params.allowed) return store.remove('PriceOracleSigner', signerId)

  let signer = PriceOracleSigner.load(signerId)
  if (signer == null) signer = new PriceOracleSigner(signerId)
  signer.signer = event.params.signer.toHexString()
  signer.priceOracle = event.address.toHexString()
  signer.save()
}

export function handleFeedSet(event: FeedSet): void {
  let baseQuote = event.params.base.toHexString() + '/' + event.params.quote.toHexString()
  let feedId = event.address.toHexString() + '/feed/' + baseQuote
  if (!event.params.feed.equals(Address.zero())) return store.remove('PriceOracleFeed', feedId)

  let feed = PriceOracleFeed.load(feedId)
  if (feed == null) feed = new PriceOracleFeed(feedId)
  feed.base = loadOrCreateERC20(event.params.base).id
  feed.quote = loadOrCreateERC20(event.params.quote).id
  feed.feed = event.params.feed.toHexString()
  feed.priceOracle = event.address.toHexString()
  feed.save()
}
