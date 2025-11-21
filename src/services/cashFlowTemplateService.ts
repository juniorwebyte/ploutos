export interface ClosingTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  lastUsed?: Date;
  data: {
    entries: any;
    exits: any;
    cancelamentos?: any[];
  };
  metadata?: {
    totalEntradas?: number;
    totalSaidas?: number;
    tags?: string[];
  };
}

class CashFlowTemplateService {
  private readonly TEMPLATES_KEY = 'cashflow_templates';
  private readonly MAX_TEMPLATES = 20;

  // Criar template
  createTemplate(
    name: string,
    data: ClosingTemplate['data'],
    description?: string,
    metadata?: ClosingTemplate['metadata']
  ): ClosingTemplate {
    const template: ClosingTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      data: {
        entries: JSON.parse(JSON.stringify(data.entries)),
        exits: JSON.parse(JSON.stringify(data.exits)),
        cancelamentos: data.cancelamentos ? JSON.parse(JSON.stringify(data.cancelamentos)) : []
      },
      metadata
    };

    this.saveTemplate(template);
    return template;
  }

  // Salvar template
  private saveTemplate(template: ClosingTemplate): void {
    const templates = this.getAllTemplates();
    templates.unshift(template);

    // Manter apenas últimos MAX_TEMPLATES
    if (templates.length > this.MAX_TEMPLATES) {
      templates.splice(this.MAX_TEMPLATES);
    }

    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
  }

  // Obter todos os templates
  getAllTemplates(): ClosingTemplate[] {
    try {
      const stored = localStorage.getItem(this.TEMPLATES_KEY);
      if (!stored) return [];
      
      const templates = JSON.parse(stored);
      return templates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        lastUsed: t.lastUsed ? new Date(t.lastUsed) : undefined
      }));
    } catch (error) {
      // Erro ao carregar templates - retornar array vazio
      return [];
    }
  }

  // Obter template por ID
  getTemplate(id: string): ClosingTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  // Aplicar template
  applyTemplate(id: string): ClosingTemplate | null {
    const template = this.getTemplate(id);
    if (!template) return null;

    // Atualizar data de último uso
    const templates = this.getAllTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index].lastUsed = new Date();
      localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
    }

    return template;
  }

  // Atualizar template
  updateTemplate(id: string, updates: Partial<ClosingTemplate>): boolean {
    const templates = this.getAllTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return false;

    templates[index] = {
      ...templates[index],
      ...updates,
      id: templates[index].id, // Manter ID original
      createdAt: templates[index].createdAt // Manter data de criação
    };

    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(templates));
    return true;
  }

  // Deletar template
  deleteTemplate(id: string): boolean {
    const templates = this.getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);
    
    if (filtered.length === templates.length) return false;
    
    localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(filtered));
    return true;
  }

  // Buscar templates
  searchTemplates(query: string): ClosingTemplate[] {
    const templates = this.getAllTemplates();
    const lowerQuery = query.toLowerCase();
    
    return templates.filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export const cashFlowTemplateService = new CashFlowTemplateService();

