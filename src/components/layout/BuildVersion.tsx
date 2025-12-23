import { useEffect, useState } from "react";

interface VersionInfo {
  version: string;
  timestamp: string;
  buildId?: string;
}

export const BuildVersion = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/version.json?t=' + Date.now()) // Cache bust
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(() => setVersionInfo(null));
  }, []);

  const isDev = process.env.NODE_ENV === 'development';
  const buildDate = versionInfo?.timestamp 
    ? new Date(versionInfo.timestamp).toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : '?';

  return (
    <div className="fixed bottom-2 left-2 z-50 text-[10px] text-muted-foreground/60 font-mono bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border/30">
      <span>v{versionInfo?.version || '?'}</span>
      {versionInfo?.buildId && (
        <>
          <span className="mx-1">|</span>
          <span>#{versionInfo.buildId}</span>
        </>
      )}
      <span className="mx-1">|</span>
      <span>{buildDate}</span>
      {isDev && <span className="ml-1 text-yellow-500">[DEV]</span>}
    </div>
  );
};
