import type { UserRole } from '@/lib/types/database'

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'batch_edit'

const PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: ['create', 'read', 'update', 'delete', 'batch_edit'],
  moderador: ['create', 'read', 'update', 'batch_edit'],
  fornecedor: ['read'],
}

export function checkPermission(role: UserRole, action: PermissionAction): boolean {
  return PERMISSIONS[role]?.includes(action) ?? false
}

export function canAccessProducts(role: UserRole): boolean {
  return role === 'admin' || role === 'moderador'
}
