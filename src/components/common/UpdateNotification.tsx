import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

const CURRENT_VERSION = "1.0.0";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const lastCheckedVersion = localStorage.getItem('app-version');
        
        if (data.version !== CURRENT_VERSION || data.version !== lastCheckedVersion) {
          setUpdateAvailable(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdate = () => {
    localStorage.setItem('app-version', CURRENT_VERSION);
    window.location.reload();
  };

  useEffect(() => {
    // Verificar na montagem do componente
    checkForUpdates();

    // Verificar periodicamente
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL);

    // Verificar quando a janela ganha foco
    const handleFocus = () => checkForUpdates();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="bg-primary text-primary-foreground border-primary shadow-lg">
        <RefreshCw className="h-4 w-4" />
        <AlertTitle>Atualização Disponível</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">Uma nova versão do sistema está disponível.</p>
          <Button
            onClick={handleUpdate}
            variant="secondary"
            size="sm"
            disabled={checking}
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar agora
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};
