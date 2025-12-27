import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>("");

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
        const acknowledgedVersion = localStorage.getItem('app-version-acknowledged');
        
        // Só mostra atualização se a versão do servidor for diferente
        // da versão que o usuário já reconheceu
        if (data.version && data.version !== acknowledgedVersion) {
          setUpdateAvailable(true);
          setLatestVersion(data.version);
        } else {
          setUpdateAvailable(false);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdate = () => {
    // Salva a versão atual como "reconhecida" e recarrega
    if (latestVersion) {
      localStorage.setItem('app-version-acknowledged', latestVersion);
    }
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
