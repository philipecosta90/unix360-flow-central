
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const AuthDebug = () => {
  const { user, session, userProfile, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        console.log('🔧 Running auth diagnostics...');
        
        // Test Supabase connection
        const { data: testData, error: testError } = await supabase
          .from('empresas')
          .select('count')
          .limit(1);
        
        // Test RLS policies
        const { data: profilesData, error: profilesError } = await supabase
          .from('perfis')
          .select('*')
          .limit(1);
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        setDebugInfo({
          supabaseConnection: testError ? `Error: ${testError.message}` : 'OK',
          rlsPolicies: profilesError ? `Error: ${profilesError.message}` : 'OK',
          sessionCheck: sessionError ? `Error: ${sessionError.message}` : 'OK',
          currentSession: currentSession ? 'Active' : 'Inactive',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('🔧 Diagnostics failed:', error);
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    runDiagnostics();
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? '⏳' : '✅'}</div>
        <div>User: {user ? '👤' : '❌'}</div>
        <div>Session: {session ? '🔑' : '❌'}</div>
        <div>Profile: {userProfile ? '📝' : '❌'}</div>
        <div>Supabase: {debugInfo.supabaseConnection || '⏳'}</div>
        <div>RLS: {debugInfo.rlsPolicies || '⏳'}</div>
        <div>Session Check: {debugInfo.sessionCheck || '⏳'}</div>
        <div>Current Session: {debugInfo.currentSession || '⏳'}</div>
        {debugInfo.error && <div className="text-red-300">Error: {debugInfo.error}</div>}
        <div className="text-gray-400 text-xs mt-2">
          Last check: {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  );
};
