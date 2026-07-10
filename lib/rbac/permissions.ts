export interface Permission {
  id: string
  code: string
  name: string
  module: string
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  permission: Permission
}

export interface Role {
  id: string
  code: string
  name: string
  role_permissions: RolePermission[]
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  role: Role
}

export interface UserWithRoles {
  id: string
  name: string
  email: string
  status: string
  user_roles: UserRole[]
}

export function hasRole(user: UserWithRoles, roleCode: string): boolean {
  return user.user_roles.some((ur) => ur.role.code === roleCode)
}

export function hasPermission(user: UserWithRoles, permissionCode: string): boolean {
  return user.user_roles.some((ur) =>
    ur.role.role_permissions.some((rp) => rp.permission.code === permissionCode)
  )
}

export function getPermissions(user: UserWithRoles): string[] {
  const perms = new Set<string>()
  for (const ur of user.user_roles) {
    for (const rp of ur.role.role_permissions) {
      perms.add(rp.permission.code)
    }
  }
  return Array.from(perms)
}

export function requirePermission(user: UserWithRoles, permissionCode: string): void {
  if (!hasPermission(user, permissionCode)) {
    throw new Error('FORBIDDEN')
  }
}
