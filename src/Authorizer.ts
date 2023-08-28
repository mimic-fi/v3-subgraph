import { Address, Bytes, crypto, log, store } from '@graphprotocol/graph-ts'

import { Permission, PermissionParam } from '../types/schema'
import { Authorized, Authorizer as AuthorizerContract, Unauthorized } from '../types/templates/Authorizer/Authorizer'

export function handleAuthorized(event: Authorized): void {
  const permissionId = getPermissionId(event.address, event.params.who, event.params.where, event.params.what)
  const permission = new Permission(permissionId)
  permission.authorizer = event.address.toHexString()
  permission.who = event.params.who.toHexString()
  permission.where = event.params.where.toHexString()
  permission.what = event.params.what.toHexString()
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
}

export function handleUnauthorized(event: Unauthorized): void {
  const permissionId = getPermissionId(event.address, event.params.who, event.params.where, event.params.what)
  const permission = Permission.load(permissionId)

  if (permission != null) {
    const params = permission.params.load()
    for (let i: i32 = 0; i < params.length; i++) store.remove('PermissionParam', params[i].id)
    store.remove('Permission', permissionId)
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
