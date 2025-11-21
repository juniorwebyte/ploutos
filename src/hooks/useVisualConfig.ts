import { useEffect, useCallback } from 'react';

export const useVisualConfig = () => {
  const aplicarLogo = useCallback((logoDataUrl: string) => {
    // Aplicar logo em elementos com classe company-logo
    if (typeof window === 'undefined') return;
    
    const logoElements = document.querySelectorAll('.company-logo') as NodeListOf<HTMLImageElement>;
    logoElements.forEach(element => {
      element.src = logoDataUrl;
    });
    
    // Aplicar logo no header se existir
    const headerLogo = document.querySelector('.header-logo') as HTMLImageElement;
    if (headerLogo) {
      headerLogo.src = logoDataUrl;
    }
  }, []);

  const aplicarFavicon = useCallback((faviconDataUrl: string) => {
    // Aplicar favicon dinamicamente
    if (typeof window === 'undefined') return;
    
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = faviconDataUrl;
    } else {
      // Criar novo elemento favicon se não existir
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = faviconDataUrl;
      document.head.appendChild(newFavicon);
    }
  }, []);

  const carregarConfiguracoesVisuais = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Carregar logo salva
      const logoSaved = localStorage.getItem('companyLogo');
      if (logoSaved) {
        aplicarLogo(logoSaved);
      }
      
      // Carregar favicon salvo
      const faviconSaved = localStorage.getItem('companyFavicon');
      if (faviconSaved) {
        aplicarFavicon(faviconSaved);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações visuais:', error);
    }
  }, [aplicarLogo, aplicarFavicon]);

  useEffect(() => {
    // Carregar configurações visuais ao inicializar o sistema
    carregarConfiguracoesVisuais();
  }, [carregarConfiguracoesVisuais]);

  const salvarLogo = useCallback((logoDataUrl: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('companyLogo', logoDataUrl);
      aplicarLogo(logoDataUrl);
    } catch (error) {
      console.error('Erro ao salvar logo:', error);
    }
  }, [aplicarLogo]);

  const salvarFavicon = useCallback((faviconDataUrl: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('companyFavicon', faviconDataUrl);
      aplicarFavicon(faviconDataUrl);
    } catch (error) {
      console.error('Erro ao salvar favicon:', error);
    }
  }, [aplicarFavicon]);

  return {
    carregarConfiguracoesVisuais,
    aplicarLogo,
    aplicarFavicon,
    salvarLogo,
    salvarFavicon
  };
};
