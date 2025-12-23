import { useEffect, useState } from "react";

interface VersionInfo {
  version: string;
  timestamp: string;
}

export const BuildVersion = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const buildTime = new Date().toISOString();

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(() => setVersionInfo(null));
  }, []);

  // Only show in development or when explicitly needed for debugging
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="fixed bottom-2 left-2 z-50 text-[10px] text-muted-foreground/60 font-mono bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border/30">
      <span>v{versionInfo?.version || '?'}</span>
      <span className="mx-1">|</span>
      <span>Build: {buildTime.slice(0, 16).replace('T', ' ')}</span>
      {isDev && <span className="ml-1 text-yellow-500">[DEV]</span>}
    </div>
  );
};
