
import { useState, useEffect } from 'react';

export const useLogo = () => {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const storedLogo = localStorage.getItem('company_logo');
    setLogo(storedLogo);

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'company_logo') {
        setLogo(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { logo };
};
