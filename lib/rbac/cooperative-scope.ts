import prisma from '@/lib/prisma/client'
import { hasRole, type UserWithRoles } from '@/lib/rbac/permissions'

export type CooperativeAccess =
  | { kind: 'ALL' }
  | { kind: 'SCOPED'; ids: string[] }

const GLOBAL_ROLES = new Set(['SYSTEM_ADMIN'])

function hasGlobalAccess(user: UserWithRoles): boolean {
  return user.user_roles.some((ur) => GLOBAL_ROLES.has(ur.role.code))
}

export async function getCooperativeAccess(user: UserWithRoles): Promise<CooperativeAccess> {
  if (hasGlobalAccess(user)) return { kind: 'ALL' }
  const rows = await prisma.userCooperative.findMany({
    where: { user_id: user.id, status: 'AKTIF' },
    select: { cooperative_id: true },
  })
  return { kind: 'SCOPED', ids: rows.map((r) => r.cooperative_id) }
}

export async function getAccessibleCooperativeIds(
  user: UserWithRoles
): Promise<'ALL' | string[]> {
  const access = await getCooperativeAccess(user)
  return access.kind === 'ALL' ? 'ALL' : access.ids
}

export async function canAccessCooperative(
  user: UserWithRoles,
  cooperativeId: string
): Promise<boolean> {
  const access = await getCooperativeAccess(user)
  if (access.kind === 'ALL') return true
  return access.ids.includes(cooperativeId)
}

export async function requireCooperativeAccess(
  user: UserWithRoles,
  cooperativeId: string
): Promise<void> {
  if (!(await canAccessCooperative(user, cooperativeId))) {
    throw new Error('FORBIDDEN_COOPERATIVE')
  }
}

/**
 * Merge the caller's cooperative scope into a Prisma `where` object.
 * Non-mutating: returns a new object. SYSTEM_ADMIN gets no filter.
 * For scoped users, adds `cooperative_id: { in: ids }` — combining with any
 * existing cooperative_id filter by intersection.
 */
export async function applyCooperativeScope<T extends Record<string, any>>(
  where: T,
  user: UserWithRoles,
  field: string = 'cooperative_id'
): Promise<T> {
  const access = await getCooperativeAccess(user)
  if (access.kind === 'ALL') return where
  if (access.ids.length === 0) {
    return { ...where, [field]: { in: [] as string[] } }
  }

  const existing = where[field]
  if (typeof existing === 'string') {
    if (!access.ids.includes(existing)) {
      return { ...where, [field]: { in: [] as string[] } }
    }
    return where
  }
  if (existing && typeof existing === 'object' && 'in' in existing && Array.isArray(existing.in)) {
    const intersection = existing.in.filter((id: string) => access.ids.includes(id))
    return { ...where, [field]: { in: intersection } }
  }
  return { ...where, [field]: { in: access.ids } }
}

export function isSystemAdmin(user: UserWithRoles): boolean {
  return hasRole(user, 'SYSTEM_ADMIN')
}
