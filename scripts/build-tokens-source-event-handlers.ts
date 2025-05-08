import * as fs from 'fs'
import { dump, load } from 'js-yaml'

/* eslint-disable @typescript-eslint/no-explicit-any */

const SUBGRAPH_YML = 'subgraph.yaml'
const HANDLER_NAME = 'handleTokensSourceSet'
const TASKS_ABI_INPUT = './abis/IAllTasks.json'
const TASKS_ABI_OUTPUT = './abis/IAllTasksWithTokensSourceSetEvents.json'
const TOKENS_SOURCE_SET_EVENTS = [
  'TokensSourceSet',
  'ProtocolFeesCollectorSet',
  'FeeClaimerSet',
  'FeeSweeperSet',
  'GmxExchangeRouterSet',
  'GnsMultiCollatDiamondSet',
  'FeeCollectorSet',
  'SourceSmartVaultSet',
  'AdapterSet',
  'SafeSet',
  'FeeVaultSet',
  'RainbowRouterSet',
]

function injectEventHandlers(): void {
  const manifest = load(fs.readFileSync(SUBGRAPH_YML, 'utf8')) as any
  const taskTemplate = manifest.templates.find((t: any) => t.name === 'Task')
  if (!taskTemplate) throw new Error('Task template not found')

  TOKENS_SOURCE_SET_EVENTS.forEach((event) => {
    taskTemplate.mapping.eventHandlers.push({ event: `${event}(indexed address)`, handler: HANDLER_NAME })
  })

  fs.writeFileSync(SUBGRAPH_YML, dump(manifest, { lineWidth: -1 }))
}

function buildCustomEventsAbi(): void {
  if (!fs.existsSync(TASKS_ABI_INPUT)) throw new Error('Missing Task ABI file')
  const file = fs.readFileSync(TASKS_ABI_INPUT, 'utf-8')
  const abi = JSON.parse(file)
  const existingNames = new Set(abi.map((entry) => entry.name))

  TOKENS_SOURCE_SET_EVENTS.forEach((event) => {
    if (existingNames.has(event)) return
    abi.push({
      name: event,
      type: 'event',
      anonymous: false,
      inputs: [{ indexed: true, internalType: 'address', name: 'value', type: 'address' }],
    })
  })

  fs.writeFileSync(TASKS_ABI_OUTPUT, JSON.stringify(abi, null, 2))
}

injectEventHandlers()
buildCustomEventsAbi()
