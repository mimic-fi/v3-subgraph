import { Address, log } from '@graphprotocol/graph-ts'

import { TaskExecuted } from '../types/Relayer/Relayer'
import { Movement, RelayedExecution, Task, Transaction } from '../types/schema'
import { Task as TaskContract } from '../types/templates/Task/Task'
import { rateInUsd } from './rates'

export function handleTaskExecuted(event: TaskExecuted): void {
  const task = Task.load(event.params.task.toHexString())
  if (task == null) return log.warning('Missing task entity {}', [event.params.task.toHexString()])

  const executionId = event.transaction.hash.toHexString() + '#' + event.params.index.toString()
  const execution = new RelayedExecution(executionId)
  const tokensSourceAddress = getTokensSource(event.params.task)
  execution.hash = event.transaction.hash.toHexString()
  execution.sender = event.transaction.from.toHexString()
  execution.executedAt = event.block.timestamp
  execution.smartVault = getSmartVault(event.params.task).toHexString()
  execution.task = event.params.task.toHexString()
  execution.index = event.params.index
  execution.succeeded = event.params.success
  execution.result = event.params.result
  execution.gasUsed = event.params.gas
  execution.gasPrice = event.transaction.gasPrice
  execution.costNative = event.transaction.gasPrice.times(event.params.gas)
  execution.totalGasUSD = rateInUsd(tokensSourceAddress, event.params.gas)
  execution.environment = task.environment
  execution.save()

  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const movementId = event.transaction.hash.toHexString() + '#' + i.toString()
    const movement = Movement.load(movementId)
    if (movement == null) break
    if (movement.relayedExecution == null) {
      movement.relayedExecution = executionId
      movement.save()
    }
  }

  // eslint-disable-next-line no-constant-condition
  for (let i: i32 = 0; true; i++) {
    const transactionId = event.transaction.hash.toHexString() + '#' + i.toString()
    const transaction = Transaction.load(transactionId)
    if (transaction == null) break
    if (transaction.relayedExecution == null) {
      transaction.relayedExecution = executionId
      transaction.save()
    }
  }
}

export function getSmartVault(address: Address): Address {
  const taskContract = TaskContract.bind(address)
  const smartVaultCall = taskContract.try_smartVault()

  if (!smartVaultCall.reverted) {
    return smartVaultCall.value
  }

  log.warning('smartVault() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}

export function getTokensSource(address: Address): Address {
  const taskContract = TaskContract.bind(address)
  const tokensSourceCall = taskContract.try_getTokensSource()

  if (!tokensSourceCall.reverted) {
    return tokensSourceCall.value
  }

  log.warning('getTokensSource() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}
