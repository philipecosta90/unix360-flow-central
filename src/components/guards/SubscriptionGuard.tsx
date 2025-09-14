import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SUBSCRIPTION_ALLOWED_PATHS = [
  '/subscription',
  '/subscription/success',
  '/subscription/cancel'
];

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const { subscription, isLoading: subscriptionLoading, isActiveOrTrial } = useSubscription();
  const location = useLocation();

  // Show loading while checking auth or subscription
  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#43B26D] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Always allow access to subscription-related pages and root
  if (SUBSCRIPTION_ALLOWED_PATHS.includes(location.pathname) || location.pathname === '/') {
    return <>{children}</>;
  }

  // If user is not authenticated, let the auth system handle it
  if (!user || !userProfile) {
    return <>{children}</>;
  }

  // Super admin bypass - only for the super admin user
  const SUPER_ADMIN_ID = 'b0896210-8487-4456-a5f1-056a0685ee7f';
  if (user?.id === SUPER_ADMIN_ID) {
    return <>{children}</>;
  }

  // Check if user has active subscription or valid trial
  if (!subscription) {
    // No subscription found - redirect to subscription page
    return <Navigate to="/subscription" replace />;
  }

  if (!isActiveOrTrial) {
    // Subscription exists but is not active or trial is expired
    return <Navigate to="/subscription" replace />;
  }

  // User has active subscription or valid trial - allow access
  return <>{children}</>;
};

// HOC version for easier usage
export const withSubscriptionGate = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <SubscriptionGuard>
      <Component {...props} />
    </SubscriptionGuard>
  );
  
  WrappedComponent.displayName = `withSubscriptionGate(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};