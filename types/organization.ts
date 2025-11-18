/**
 * Organization and RBAC Types
 * Multi-tenant data model definitions
 */

import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'manager' | 'recruiter';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

export interface Organization {
  id?: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscriptionStatus: SubscriptionStatus;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  memberIds: string[];
  settings?: {
    maxMembers?: number;
    maxCVs?: number;
    features?: string[];
  };
}

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: UserRole;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  invitedBy?: string;
  isActive: boolean;
}

export interface OrganizationInvitation {
  id?: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: 'pending' | 'accepted' | 'expired' | 'rejected';
  token: string;
}

export interface RBACPermissions {
  canUploadCVs: boolean;
  canViewAllCVs: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
  canAssignRoles: boolean;
  canDeleteCVs: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  canManageIntegrations: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RBACPermissions> = {
  admin: {
    canUploadCVs: true,
    canViewAllCVs: true,
    canManageTeam: true,
    canManageBilling: true,
    canAssignRoles: true,
    canDeleteCVs: true,
    canExportData: true,
    canViewAnalytics: true,
    canManageIntegrations: true,
  },
  manager: {
    canUploadCVs: true,
    canViewAllCVs: true,
    canManageTeam: false,
    canManageBilling: false,
    canAssignRoles: true, // Can assign recruiter role only
    canDeleteCVs: true,
    canExportData: true,
    canViewAnalytics: true,
    canManageIntegrations: false,
  },
  recruiter: {
    canUploadCVs: false,
    canViewAllCVs: false, // Only assigned shortlists
    canManageTeam: false,
    canManageBilling: false,
    canAssignRoles: false,
    canDeleteCVs: false,
    canExportData: false,
    canViewAnalytics: false,
    canManageIntegrations: false,
  },
};

export function hasPermission(role: UserRole, permission: keyof RBACPermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function canAssignRole(currentRole: UserRole, targetRole: UserRole): boolean {
  if (currentRole === 'admin') return true;
  if (currentRole === 'manager' && targetRole === 'recruiter') return true;
  return false;
}
