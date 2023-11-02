import { Address } from '@graphprotocol/graph-ts'

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
  isZkEvm,
} from '../Networks'

export function getUsdc(): Address {
  return Address.fromString(getUsdcAddress())
}

export function getWrappedNativeToken(): Address {
  return Address.fromString(getWrappedNativeTokenAddress())
}

/* eslint-disable no-secrets/no-secrets */

function getUsdcAddress(): string {
  if (isMainnet()) return '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  if (isPolygon()) return '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
  if (isOptimism()) return '0x7f5c764cbc14f9669b88837ca1490cca17c31607'
  if (isArbitrum()) return '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
  if (isAvalanche()) return '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  if (isBinance()) return '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
  if (isFantom()) return '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75'
  if (isGnosis()) return '0xddafbb505ad214d7b80b1f830fccc89b60fb7a83'
  if (isBase()) return '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  if (isZkEvm()) return '0xa8ce8aee21bc2a48a5ef670afcc9274c7bbbc035'
  return '0x0000000000000000000000000000000000000000'
}

function getWrappedNativeTokenAddress(): string {
  if (isMainnet()) return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
  if (isPolygon()) return '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' // WMATIC
  if (isOptimism()) return '0x4200000000000000000000000000000000000006' // WETH
  if (isArbitrum()) return '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' // WETH
  if (isAvalanche()) return '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' // WAVAX
  if (isBinance()) return '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' // WBNB
  if (isFantom()) return '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83' // WFTM
  if (isGnosis()) return '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d' // WXDAI
  if (isBase()) return '0x4200000000000000000000000000000000000006' // WETH
  if (isZkEvm()) return '0x4F9A0e7FD2Bf6067db6994CF12E4495Df938E6e9' // WETH
  return '0x0000000000000000000000000000000000000000'
}
