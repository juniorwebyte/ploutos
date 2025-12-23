// Serviço de gestão de lojas e caixas
import { Loja, Caixa, TransferenciaCaixa } from '../types/store';

class StoreService {
  private readonly LOJAS_KEY = 'ploutos_lojas';
  private readonly CAIXAS_KEY = 'ploutos_caixas';
  private readonly TRANSFERENCIAS_KEY = 'ploutos_transferencias';

  // ========== LOJAS ==========
  
  getLojas(): Loja[] {
    try {
      const stored = localStorage.getItem(this.LOJAS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  getLoja(id: string): Loja | null {
    const lojas = this.getLojas();
    return lojas.find(l => l.id === id) || null;
  }

  saveLoja(loja: Loja): void {
    const lojas = this.getLojas();
    const index = lojas.findIndex(l => l.id === loja.id);
    
    if (index >= 0) {
      lojas[index] = { ...loja, dataAtualizacao: new Date().toISOString() };
    } else {
      lojas.push({ ...loja, dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() });
    }
    
    localStorage.setItem(this.LOJAS_KEY, JSON.stringify(lojas));
  }

  deleteLoja(id: string): boolean {
    const lojas = this.getLojas();
    const filtered = lojas.filter(l => l.id !== id);
    
    if (filtered.length < lojas.length) {
      localStorage.setItem(this.LOJAS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // ========== CAIXAS ==========
  
  getCaixas(lojaId?: string): Caixa[] {
    try {
      const stored = localStorage.getItem(this.CAIXAS_KEY);
      const caixas: Caixa[] = stored ? JSON.parse(stored) : [];
      return lojaId ? caixas.filter(c => c.lojaId === lojaId) : caixas;
    } catch {
      return [];
    }
  }

  getCaixa(id: string): Caixa | null {
    const caixas = this.getCaixas();
    return caixas.find(c => c.id === id) || null;
  }

  saveCaixa(caixa: Caixa): void {
    const caixas = this.getCaixas();
    const index = caixas.findIndex(c => c.id === caixa.id);
    
    if (index >= 0) {
      caixas[index] = caixa;
    } else {
      caixas.push(caixa);
    }
    
    localStorage.setItem(this.CAIXAS_KEY, JSON.stringify(caixas));
  }

  abrirCaixa(caixaId: string, operador: string): boolean {
    const caixa = this.getCaixa(caixaId);
    if (!caixa || caixa.aberto) return false;
    
    caixa.aberto = true;
    caixa.operadorAtual = operador;
    caixa.dataAbertura = new Date().toISOString();
    this.saveCaixa(caixa);
    return true;
  }

  fecharCaixa(caixaId: string): boolean {
    const caixa = this.getCaixa(caixaId);
    if (!caixa || !caixa.aberto) return false;
    
    caixa.aberto = false;
    caixa.operadorAtual = undefined;
    caixa.dataFechamento = new Date().toISOString();
    this.saveCaixa(caixa);
    return true;
  }

  // ========== TRANSFERÊNCIAS ==========
  
  getTransferencias(caixaId?: string): TransferenciaCaixa[] {
    try {
      const stored = localStorage.getItem(this.TRANSFERENCIAS_KEY);
      const transferencias: TransferenciaCaixa[] = stored ? JSON.parse(stored) : [];
      return caixaId 
        ? transferencias.filter(t => t.origemCaixaId === caixaId || t.destinoCaixaId === caixaId)
        : transferencias;
    } catch {
      return [];
    }
  }

  criarTransferencia(transferencia: Omit<TransferenciaCaixa, 'id' | 'data' | 'confirmada'>): TransferenciaCaixa {
    const transferencias = this.getTransferencias();
    const nova: TransferenciaCaixa = {
      ...transferencia,
      id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: new Date().toISOString(),
      confirmada: false
    };
    
    transferencias.push(nova);
    localStorage.setItem(this.TRANSFERENCIAS_KEY, JSON.stringify(transferencias));
    return nova;
  }

  confirmarTransferencia(id: string): boolean {
    const transferencias = this.getTransferencias();
    const index = transferencias.findIndex(t => t.id === id);
    
    if (index >= 0 && !transferencias[index].confirmada) {
      transferencias[index].confirmada = true;
      localStorage.setItem(this.TRANSFERENCIAS_KEY, JSON.stringify(transferencias));
      return true;
    }
    return false;
  }
}

export const storeService = new StoreService();
