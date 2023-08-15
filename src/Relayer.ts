import { Address, log } from '@graphprotocol/graph-ts'

import { TaskExecuted } from '../types/Relayer/Relayer'
import { Movement, RelayedExecution, Transaction } from '../types/schema'
import { Task as TaskContract } from '../types/templates/Task/Task'

export function handleTaskExecuted(event: TaskExecuted): void {
  let executionId = event.transaction.hash.toHexString() + '#' + event.params.index.toString()
  let execution = new RelayedExecution(executionId)
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
  execution.save()

  for (let i: i32 = 0; true; i++) {
    const movementId = event.transaction.hash.toHexString() + '#' + i.toString()
    let movement = Movement.load(movementId)
    if (movement == null) break
    if (movement.relayedExecution == null) {
      movement.relayedExecution = executionId
      movement.save()
    }
  }

  for (let i: i32 = 0; true; i++) {
    const transactionId = event.transaction.hash.toHexString() + '#' + i.toString()
    let transaction = Transaction.load(transactionId)
    if (transaction == null) break
    if (transaction.relayedExecution == null) {
      transaction.relayedExecution = executionId
      transaction.save()
    }
  }
}

export function getSmartVault(address: Address): Address {
  let taskContract = TaskContract.bind(address)
  let smartVaultCall = taskContract.try_smartVault()

  if (!smartVaultCall.reverted) {
    return smartVaultCall.value
  }

  log.warning('smartVault() call reverted for task {}', [address.toHexString()])
  return Address.zero()
}