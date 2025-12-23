// Serviço de gestão de categorias e tags
import { Categoria, Tag, CategoriaEntry } from '../types/categories';

class CategoryService {
  private readonly CATEGORIAS_KEY = 'ploutos_categorias';
  private readonly TAGS_KEY = 'ploutos_tags';
  private readonly CORES_PREDEFINIDAS = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#EC4899', // Rosa
    '#06B6D4', // Ciano
    '#84CC16', // Lima
    '#F97316', // Laranja
    '#6366F1', // Índigo
  ];

  // ========== CATEGORIAS ==========
  
  getCategorias(tipo?: 'entrada' | 'saida' | 'ambos'): Categoria[] {
    try {
      const stored = localStorage.getItem(this.CATEGORIAS_KEY);
      const categorias: Categoria[] = stored ? JSON.parse(stored) : [];
      
      // Criar categorias padrão se não existirem
      if (categorias.length === 0) {
        const padroes = this.getCategoriasPadrao();
        this.saveCategorias(padroes);
        return tipo ? padroes.filter(c => c.tipo === tipo || c.tipo === 'ambos') : padroes;
      }
      
      return tipo 
        ? categorias.filter(c => c.ativa && (c.tipo === tipo || c.tipo === 'ambos'))
        : categorias.filter(c => c.ativa);
    } catch {
      return [];
    }
  }

  getCategoria(id: string): Categoria | null {
    const categorias = this.getCategorias();
    return categorias.find(c => c.id === id) || null;
  }

  saveCategoria(categoria: Categoria): void {
    const categorias = this.getCategorias();
    const index = categorias.findIndex(c => c.id === categoria.id);
    
    if (index >= 0) {
      categorias[index] = { ...categoria, dataAtualizacao: new Date().toISOString() };
    } else {
      categorias.push({ 
        ...categoria, 
        dataCriacao: new Date().toISOString(), 
        dataAtualizacao: new Date().toISOString() 
      });
    }
    
    this.saveCategorias(categorias);
  }

  deleteCategoria(id: string): boolean {
    const categorias = this.getCategorias();
    const filtered = categorias.filter(c => c.id !== id);
    
    if (filtered.length < categorias.length) {
      this.saveCategorias(filtered);
      return true;
    }
    return false;
  }

  private saveCategorias(categorias: Categoria[]): void {
    localStorage.setItem(this.CATEGORIAS_KEY, JSON.stringify(categorias));
  }

  private getCategoriasPadrao(): Categoria[] {
    return [
      {
        id: 'cat_vendas',
        nome: 'Vendas',
        tipo: 'entrada',
        cor: '#10B981',
        icone: 'TrendingUp',
        descricao: 'Receitas de vendas',
        ativa: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      },
      {
        id: 'cat_fornecedores',
        nome: 'Fornecedores',
        tipo: 'saida',
        cor: '#EF4444',
        icone: 'Truck',
        descricao: 'Pagamentos a fornecedores',
        ativa: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      },
      {
        id: 'cat_salarios',
        nome: 'Salários',
        tipo: 'saida',
        cor: '#3B82F6',
        icone: 'Users',
        descricao: 'Pagamento de salários',
        ativa: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      },
      {
        id: 'cat_impostos',
        nome: 'Impostos',
        tipo: 'saida',
        cor: '#F59E0B',
        icone: 'FileText',
        descricao: 'Pagamento de impostos',
        ativa: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      },
      {
        id: 'cat_servicos',
        nome: 'Serviços',
        tipo: 'ambos',
        cor: '#8B5CF6',
        icone: 'Wrench',
        descricao: 'Serviços prestados ou recebidos',
        ativa: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      },
      {
        id: 'cat_outros',
        nome: 'Outros',
        tipo: 'ambos',
        cor: '#6B7280',
        icone: 'MoreHorizontal',
        descricao: 'Outras movimentações',
        ativa: true,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      }
    ];
  }

  getCorAleatoria(): string {
    return this.CORES_PREDEFINIDAS[Math.floor(Math.random() * this.CORES_PREDEFINIDAS.length)];
  }

  // ========== TAGS ==========
  
  getTags(categoriaId?: string): Tag[] {
    try {
      const stored = localStorage.getItem(this.TAGS_KEY);
      const tags: Tag[] = stored ? JSON.parse(stored) : [];
      
      return categoriaId 
        ? tags.filter(t => t.ativa && t.categoriaId === categoriaId)
        : tags.filter(t => t.ativa);
    } catch {
      return [];
    }
  }

  getTag(id: string): Tag | null {
    const tags = this.getTags();
    return tags.find(t => t.id === id) || null;
  }

  saveTag(tag: Tag): void {
    const tags = this.getTags();
    const index = tags.findIndex(t => t.id === tag.id);
    
    if (index >= 0) {
      tags[index] = tag;
    } else {
      tags.push({ ...tag, dataCriacao: new Date().toISOString() });
    }
    
    localStorage.setItem(this.TAGS_KEY, JSON.stringify(tags));
  }

  deleteTag(id: string): boolean {
    const tags = this.getTags();
    const filtered = tags.filter(t => t.id !== id);
    
    if (filtered.length < tags.length) {
      localStorage.setItem(this.TAGS_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // ========== ESTATÍSTICAS ==========
  
  getEstatisticasPorCategoria(
    movimentacoes: Array<{ categoria?: CategoriaEntry; valor: number; tipo: 'entrada' | 'saida' }>,
    periodo?: { inicio: Date; fim: Date }
  ): Record<string, { total: number; quantidade: number }> {
    const stats: Record<string, { total: number; quantidade: number }> = {};
    
    movimentacoes.forEach(mov => {
      if (!mov.categoria?.categoriaId) return;
      
      const catId = mov.categoria.categoriaId;
      if (!stats[catId]) {
        stats[catId] = { total: 0, quantidade: 0 };
      }
      
      stats[catId].total += mov.valor;
      stats[catId].quantidade += 1;
    });
    
    return stats;
  }
}

export const categoryService = new CategoryService();
