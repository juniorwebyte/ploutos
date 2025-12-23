// Tipos para sistema multi-loja
export interface Loja {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  contato?: {
    telefone: string;
    email: string;
  };
  ativa: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Caixa {
  id: string;
  lojaId: string;
  nome: string;
  numero: number;
  ativo: boolean;
  fundoCaixaPadrao: number;
  operadorAtual?: string;
  aberto: boolean;
  dataAbertura?: string;
  dataFechamento?: string;
}

export interface TransferenciaCaixa {
  id: string;
  origemCaixaId: string;
  destinoCaixaId: string;
  valor: number;
  motivo: string;
  operador: string;
  data: string;
  confirmada: boolean;
}
