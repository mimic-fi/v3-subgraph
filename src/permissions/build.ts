import * as fs from 'fs'
import { ethers } from 'ethers'

const FUNCTIONS = []
const DEPENDENCIES_DIR = './node_modules/@mimic-fi'
const DICTIONARY_OUTPUT = './src/permissions/dictionary.json'

fs.readdirSync(DEPENDENCIES_DIR).forEach(dependency => {
  const interfacesDir = `${DEPENDENCIES_DIR}/${dependency}/artifacts/contracts/interfaces`
  if (!fs.existsSync(interfacesDir)) return
  fs.readdirSync(interfacesDir).forEach(file => processInterfaces(`${interfacesDir}/${file}`))
})

if (fs.existsSync(DICTIONARY_OUTPUT)) fs.unlinkSync(DICTIONARY_OUTPUT)
fs.writeFileSync(DICTIONARY_OUTPUT, JSON.stringify(FUNCTIONS, null, 2))

function processInterfaces(path: string): void {
  if (fs.statSync(path).isDirectory()) return fs.readdirSync(path).forEach(file => processInterfaces(`${path}/${file}`))

  const data = JSON.parse(fs.readFileSync(path).toString())
  if (!data.abi) return

  const iface = new ethers.utils.Interface(data.abi)
  data.abi
    .filter(input => input.type === 'function')
    .filter(input => input.stateMutability === 'nonpayable')
    .map(input => ({ selector: iface.getSighash(input.name), function: input.name }))
    .forEach(fn => FUNCTIONS.push(fn))
}
