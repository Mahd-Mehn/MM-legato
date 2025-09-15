/**
 * Role-based access control hook
 * Provides utilities for checking user roles and permissions
 */

import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User, RoleCheck } from '../lib/api/types';

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  reader: 1,
  writer: 2,
  studio: 3,
  admin: 4,
} as const;

// Define permissions for each role
const ROLE_PERMISSIONS = {
  reader: [
    'read:stories',
    'create:comments',
    'create:ratings',
    'manage:own_profile',
    'manage:own_bookmarks',
    'follow:authors',
  ],
  writer: [
    'read:stories',
    'create:comments',
    'create:ratings',
    'manage:own_profile',
    'manage:own_bookmarks',
    'follow:authors',
    'create:stories',
    'manage:own_stories',
    'view:own_analytics',
    'manage:own_earnings',
    'create:ip_protection',
    'manage:own_licensing',
  ],
  studio: [
    'read:stories',
    'create:comments',
    'create:ratings',
    'manage:own_profile',
    'manage:own_bookmarks',
    'follow:authors',
    'view:marketplace',
    'create:license_requests',
    'manage:own_licenses',
    'view:analytics',
  ],
  admin: [
    'read:stories',
    'create:comments',
    'create:ratings',
    'manage:own_profile',
    'manage:own_bookmarks',
    'follow:authors',
    'create:stories',
    'manage:own_stories',
    'view:own_analytics',
    'manage:own_earnings',
    'create:ip_protection',
    'manage:own_licensing',
    'view:marketplace',
    'create:license_requests',
    'manage:own_licenses',
    'view:analytics',
    'manage:users',
    'manage:content',
    'manage:system',
    'view:admin_analytics',
    'manage:platform_settings',
  ],
} as const;

export interface UseRoleAccessReturn extends RoleCheck {
  user: User | null;
  isAuthenticated: boolean;
  userRole: string | null;
  roleLevel: number;
  canAccessWriterFeatures: boolean;
  canAccessStudioFeatures: boolean;
  canAccessAdminFeatures: boolean;
  isReader: boolean;
  isWriter: boolean;
  isStudio: boolean;
  isAdmin: boolean;
  hasMinimumRole: (minimumRole: keyof typeof ROLE_HIERARCHY) => boolean;
  getPermissions: () => string[];
}

/**
 * Hook for role-based access control
 */
export function useRoleAccess(): UseRoleAccessReturn {
  const { user, isAuthenticated } = useAuth();

  const roleCheck = useMemo((): RoleCheck & {
    userRole: string | null;
    roleLevel: number;
    canAccessWriterFeatures: boolean;
    canAccessStudioFeatures: boolean;
    canAccessAdminFeatures: boolean;
    isReader: boolean;
    isWriter: boolean;
    isStudio: boolean;
    isAdmin: boolean;
    hasMinimumRole: (minimumRole: keyof typeof ROLE_HIERARCHY) => boolean;
    getPermissions: () => string[];
  } => {
    const userRole = user?.role || null;
    const roleLevel = userRole ? ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0 : 0;

    const hasRole = (role: string): boolean => {
      return userRole === role;
    };

    const hasPermission = (permission: string): boolean => {
      if (!userRole || !isAuthenticated) return false;
      
      const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
      return permissions.includes(permission as any);
    };

    const hasAnyRole = (roles: string[]): boolean => {
      return userRole ? roles.includes(userRole) : false;
    };

    const hasAllRoles = (roles: string[]): boolean => {
      // A user can only have one role, so this only returns true if there's exactly one role
      return roles.length === 1 && hasRole(roles[0]);
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
      return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
      return permissions.every(permission => hasPermission(permission));
    };

    const hasMinimumRole = (minimumRole: keyof typeof ROLE_HIERARCHY): boolean => {
      const minimumLevel = ROLE_HIERARCHY[minimumRole];
      return roleLevel >= minimumLevel;
    };

    const getPermissions = (): string[] => {
      if (!userRole) return [];
      return ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || [];
    };

    return {
      hasRole,
      hasPermission,
      hasAnyRole,
      hasAllRoles,
      hasAnyPermission,
      hasAllPermissions,
      userRole,
      roleLevel,
      canAccessWriterFeatures: hasMinimumRole('writer'),
      canAccessStudioFeatures: hasMinimumRole('studio'),
      canAccessAdminFeatures: hasMinimumRole('admin'),
      isReader: hasRole('reader'),
      isWriter: hasRole('writer'),
      isStudio: hasRole('studio'),
      isAdmin: hasRole('admin'),
      hasMinimumRole,
      getPermissions,
    };
  }, [user, isAuthenticated]);

  return {
    user,
    isAuthenticated,
    ...roleCheck,
  };
}

/**
 * Higher-order component for role-based access control
 */
export function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: string[] | string,
  fallbackComponent?: React.ComponentType<any>
) {
  return function RoleProtectedComponent(props: P) {
    const { hasAnyRole, isAuthenticated } = useRoleAccess();
    
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasAccess = isAuthenticated && hasAnyRole(roles);

    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent />;
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for permission-based access control
 */
export function usePermissions(requiredPermissions: string[] | string) {
  const { hasAnyPermission, hasAllPermissions, getPermissions } = useRoleAccess();
  
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  
  return {
    hasAnyPermission: hasAnyPermission(permissions),
    hasAllPermissions: hasAllPermissions(permissions),
    userPermissions: getPermissions(),
  };
}

/**
 * Component for conditional rendering based on roles
 */
interface RoleGateProps {
  roles: string[] | string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGate({ roles, fallback = null, children }: RoleGateProps) {
  const { hasAnyRole, isAuthenticated } = useRoleAccess();
  
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const hasAccess = isAuthenticated && hasAnyRole(roleArray);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component for conditional rendering based on permissions
 */
interface PermissionGateProps {
  permissions: string[] | string;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ 
  permissions, 
  requireAll = false, 
  fallback = null, 
  children 
}: PermissionGateProps) {
  const { hasAnyPermission, hasAllPermissions } = useRoleAccess();
  
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  const hasAccess = requireAll 
    ? hasAllPermissions(permissionArray)
    : hasAnyPermission(permissionArray);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}