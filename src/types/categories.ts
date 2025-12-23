// Tipos para sistema de categorias
export interface Categoria {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida' | 'ambos';
  cor: string; // Cor em hex para visualização
  icone?: string; // Nome do ícone (lucide-react)
  descricao?: string;
  ativa: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Tag {
  id: string;
  nome: string;
  cor: string;
  categoriaId?: string; // Opcional: associar tag a uma categoria
  ativa: boolean;
  dataCriacao: string;
}

export interface CategoriaEntry {
  categoriaId: string;
  tagIds?: string[];
  observacao?: string;
}
