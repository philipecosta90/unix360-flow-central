
import { UserProfile } from "@/types/auth";

export const hasActiveSubscription = (userProfile: UserProfile | null): boolean => {
  if (!userProfile || !userProfile.ativo) return false;
  
  const now = new Date();
  const trialEndDate = userProfile.trial_end_date ? new Date(userProfile.trial_end_date) : null;
  
  return (
    userProfile.subscription_status === 'active' ||
    (userProfile.subscription_status === 'trial' && trialEndDate && trialEndDate > now)
  );
};

export const canMakeChanges = (userProfile: UserProfile | null): boolean => {
  return hasActiveSubscription(userProfile);
};

export const hasPermission = (
  userProfile: UserProfile | null,
  requiredPermission: 'admin' | 'editor' | 'operacional' | 'visualizacao'
): boolean => {
  if (!userProfile || !userProfile.ativo || !hasActiveSubscription(userProfile)) return false;
  
  const permissionHierarchy = {
    'admin': 4,
    'editor': 3,
    'operacional': 2,
    'visualizacao': 1
  };
  
  // Use roles array if available, otherwise fall back to nivel_permissao for backward compatibility
  const userRoles = userProfile.roles || [userProfile.nivel_permissao];
  const highestRole = userRoles.reduce((highest, role) => {
    const roleLevel = permissionHierarchy[role];
    const highestLevel = permissionHierarchy[highest];
    return roleLevel > highestLevel ? role : highest;
  }, 'visualizacao' as const);
  
  const userLevel = permissionHierarchy[highestRole];
  const requiredLevel = permissionHierarchy[requiredPermission];
  
  return userLevel >= requiredLevel;
};

export const isAdmin = (userProfile: UserProfile | null): boolean => {
  if (!userProfile || !userProfile.ativo) return false;
  // Check roles array if available, otherwise fall back to nivel_permissao
  const userRoles = userProfile.roles || [userProfile.nivel_permissao];
  return userRoles.includes('admin');
};

export const canEditData = (userProfile: UserProfile | null): boolean => {
  return hasPermission(userProfile, 'editor') && canMakeChanges(userProfile);
};

export const canCreateRecords = (userProfile: UserProfile | null): boolean => {
  return hasPermission(userProfile, 'operacional') && canMakeChanges(userProfile);
};

export const validateCompanyAccess = (
  userProfile: UserProfile | null,
  recordCompanyId: string
): boolean => {
  if (!userProfile || !userProfile.ativo) return false;
  return userProfile.empresa_id === recordCompanyId;
};

export const isActiveUser = (userProfile: UserProfile | null): boolean => {
  return userProfile?.ativo === true;
};

export const sanitizeUserInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};
