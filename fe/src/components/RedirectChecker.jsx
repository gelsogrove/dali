import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../config/api';

/**
 * RedirectChecker - Controllo globale redirect SEO
 * 
 * Questo componente controlla se l'URL corrente è presente nella tabella redirects.
 * Se esiste un redirect, naviga automaticamente alla nuova URL (301).
 * 
 * Deve essere posizionato dentro <Router> per accedere a useLocation/useNavigate.
 */
export default function RedirectChecker({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        // Normalizza il path (rimuovi trailing slash)
        const currentPath = location.pathname.replace(/\/$/, '') || '/';
        
        // Salta il check per risorse statiche e API
        if (currentPath.startsWith('/api') || 
            currentPath.startsWith('/assets') ||
            currentPath.includes('.')) {
          setChecking(false);
          return;
        }

        // Controlla se esiste un redirect per questo path
        const response = await api.get(`/redirects/resolve?urlOld=${encodeURIComponent(currentPath)}`);
        
        if (response.success && response.urlNew) {
          console.log(`[SEO Redirect] 301: ${currentPath} → ${response.urlNew}`);
          setShouldRedirect(true);
          
          // Usa window.location.replace per un vero 301 redirect
          // (non usa navigate perché vogliamo che i motori di ricerca vedano il 301)
          window.location.replace(response.urlNew);
          return;
        }
      } catch (err) {
        // Nessun redirect trovato, continua normalmente
        // Non logghiamo per evitare spam nella console
      } finally {
        setChecking(false);
      }
    };

    setChecking(true);
    checkRedirect();
  }, [location.pathname]);

  // Durante il check del redirect, mostra un loader minimo
  // per evitare flash di contenuto
  if (checking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#faf8f6'
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #eee',
          borderTop: '3px solid #c19280',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Se stiamo facendo redirect, non mostrare nulla
  if (shouldRedirect) {
    return null;
  }

  // Nessun redirect, mostra il contenuto normale
  return children;
}
