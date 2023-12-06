import { Address, BigInt, Bytes, crypto, log, store } from '@graphprotocol/graph-ts'

import { Permission, PermissionParam, Task } from '../types/schema'
import { Authorized, Authorizer as AuthorizerContract, Unauthorized } from '../types/templates/Authorizer/Authorizer'
import { getFunctionNameForSelector } from './permissions/index'

export function handleAuthorized(event: Authorized): void {
  const permissionId = getPermissionId(event.address, event.params.who, event.params.where, event.params.what)
  const existsPermission = Permission.load(permissionId) != null
  const permission = (existsPermission ? Permission.load(permissionId) : new Permission(permissionId))!
  const what = event.params.what.toHexString()
  permission.authorizer = event.address.toHexString()
  permission.who = event.params.who.toHexString()
  permission.where = event.params.where.toHexString()
  permission.what = what
  permission.method = getFunctionNameForSelector(what)
  permission.save()

  const authorizerContract = AuthorizerContract.bind(event.address)
  const getPermissionParamsCall = authorizerContract.try_getPermissionParams(
    event.params.who,
    event.params.where,
    event.params.what
  )

  if (getPermissionParamsCall.reverted) {
    log.warning('getPermissionParams() call reverted for authorizer {}', [event.address.toHexString()])
    return
  }

  const params = getPermissionParamsCall.value
  for (let i: i32 = 0; i < params.length; i++) {
    const paramId = permissionId + '/param/' + i.toString()
    const param = new PermissionParam(paramId)
    param.op = parseOp(params[i].op)
    param.value = params[i].value.toHexString()
    param.permission = permissionId
    param.save()
  }

  if (!existsPermission) {
    const task = Task.load(event.params.who.toHexString())
    if (task != null) {
      task.permissions = task.permissions.plus(BigInt.fromI32(1))
      task.save()
    }
  }
}

export function handleUnauthorized(event: Unauthorized): void {
  const permissionId = getPermissionId(event.address, event.params.who, event.params.where, event.params.what)
  const permission = Permission.load(permissionId)

  if (permission != null) {
    const params = permission.params.load()
    for (let i: i32 = 0; i < params.length; i++) store.remove('PermissionParam', params[i].id)
    store.remove('Permission', permissionId)

    const task = Task.load(event.params.who.toHexString())
    if (task != null && task.permissions.gt(BigInt.zero())) {
      task.permissions = task.permissions.minus(BigInt.fromI32(1))
      task.save()
    }
  }
}

function parseOp(op: i32): string {
  if (op == 0) return 'NONE'
  if (op == 1) return 'EQ'
  if (op == 2) return 'NEQ'
  if (op == 3) return 'GT'
  if (op == 4) return 'LT'
  if (op == 5) return 'GTE'
  if (op == 6) return 'LTE'
  return 'Unknown'
}

function getPermissionId(authorizer: Address, who: Address, where: Address, what: Bytes): string {
  return crypto
    .keccak256(
      Bytes.fromHexString(
        authorizer.toHexString() +
          who.toHexString().slice(2) +
          where.toHexString().slice(2) +
          what.toHexString().slice(2)
      )
    )
    .toHexString()
}
