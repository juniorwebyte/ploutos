import { useEffect } from 'react';

export const useVisualConfig = () => {
  const carregarConfiguracoesVisuais = () => {
    try {
      // Verificar se estamos no browser
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

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
  };

  useEffect(() => {
    // Carregar configurações visuais ao inicializar o sistema
    carregarConfiguracoesVisuais();
  }, []);

  const aplicarLogo = (logoDataUrl: string) => {
    try {
      if (typeof window === 'undefined' || !document) {
        return;
      }
      // Aplicar logo em elementos com classe company-logo
      const logoElements = document.querySelectorAll('.company-logo') as NodeListOf<HTMLImageElement>;
      logoElements.forEach(element => {
        element.src = logoDataUrl;
      });
      
      // Aplicar logo no header se existir
      const headerLogo = document.querySelector('.header-logo') as HTMLImageElement;
      if (headerLogo) {
        headerLogo.src = logoDataUrl;
      }
    } catch (error) {
      console.error('Erro ao aplicar logo:', error);
    }
  };

  const aplicarFavicon = (faviconDataUrl: string) => {
    try {
      if (typeof window === 'undefined' || !document) {
        return;
      }
      // Aplicar favicon dinamicamente
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
    } catch (error) {
      console.error('Erro ao aplicar favicon:', error);
    }
  };

  const salvarLogo = (logoDataUrl: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('companyLogo', logoDataUrl);
        aplicarLogo(logoDataUrl);
      }
    } catch (error) {
      console.error('Erro ao salvar logo:', error);
    }
  };

  const salvarFavicon = (faviconDataUrl: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('companyFavicon', faviconDataUrl);
        aplicarFavicon(faviconDataUrl);
      }
    } catch (error) {
      console.error('Erro ao salvar favicon:', error);
    }
  };

  return {
    carregarConfiguracoesVisuais,
    aplicarLogo,
    aplicarFavicon,
    salvarLogo,
    salvarFavicon
  };
};
