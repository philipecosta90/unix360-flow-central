import { User } from "@supabase/supabase-js";

// ID do super admin do sistema
export const SUPER_ADMIN_ID = 'b0896210-8487-4456-a5f1-056a0685ee7f';

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.id === SUPER_ADMIN_ID;
};

export const canAccessGlobalAdmin = (user: User | null): boolean => {
  return isSuperAdmin(user);
};