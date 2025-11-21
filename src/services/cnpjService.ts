// Serviço para consulta de CNPJ via API pública
export interface EmpresaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  capitalSocial?: number;
  dataAbertura?: string;
  naturezaJuridica?: string;
}

class CNPJService {
  // API pública gratuita para consulta de CNPJ
  private baseUrl = 'https://www.receitaws.com.br/v1';

  /**
   * Consulta dados da empresa pelo CNPJ
   */
  async consultarCNPJ(cnpj: string): Promise<EmpresaData | null> {
    try {
      // Remove formatação do CNPJ
      const cleanCnpj = cnpj.replace(/\D/g, '');

      // Valida se tem 14 dígitos
      if (cleanCnpj.length !== 14) {
        return null;
      }

      // Consulta na API ReceitaWS (gratuita, sem necessidade de autenticação)
      const response = await fetch(`${this.baseUrl}/${cleanCnpj}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao consultar CNPJ');
      }

      const data = await response.json();

      // Verifica se a consulta foi bem-sucedida
      if (data.status === 'ERROR') {
        throw new Error(data.message || 'CNPJ não encontrado');
      }

      // Mapeia os dados da API para nosso formato
      return {
        cnpj: data.cnpj || cleanCnpj,
        razaoSocial: data.nome || '',
        nomeFantasia: data.fantasia || data.nome || '',
        situacao: data.situacao || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        telefone: data.telefone || '',
        email: data.email || '',
        capitalSocial: data.capital_social ? parseFloat(data.capital_social) : undefined,
        dataAbertura: data.abertura || '',
        naturezaJuridica: data.natureza_juridica || '',
      };
    } catch (error: any) {
      // Erro ao consultar CNPJ
      throw new Error(error.message || 'Erro ao consultar CNPJ. Tente novamente.');
    }
  }

  /**
   * Valida formato de CNPJ
   */
  validarCNPJ(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    return cleanCnpj.length === 14;
  }
}

export default new CNPJService();

