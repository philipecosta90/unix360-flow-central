
import { UserProfile } from "@/types/auth";

export const hasPermission = (
  userProfile: UserProfile | null,
  requiredPermission: 'admin' | 'editor' | 'operacional' | 'visualizacao'
): boolean => {
  if (!userProfile || !userProfile.ativo) return false;
  
  const permissionHierarchy = {
    'admin': 4,
    'editor': 3,
    'operacional': 2,
    'visualizacao': 1
  };
  
  const userLevel = permissionHierarchy[userProfile.nivel_permissao];
  const requiredLevel = permissionHierarchy[requiredPermission];
  
  return userLevel >= requiredLevel;
};

export const isAdmin = (userProfile: UserProfile | null): boolean => {
  return userProfile?.nivel_permissao === 'admin' && userProfile?.ativo === true;
};

export const canEditData = (userProfile: UserProfile | null): boolean => {
  return hasPermission(userProfile, 'editor');
};

export const canCreateRecords = (userProfile: UserProfile | null): boolean => {
  return hasPermission(userProfile, 'operacional');
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
