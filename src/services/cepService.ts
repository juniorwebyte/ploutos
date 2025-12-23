/**
 * Serviço de busca de CEP
 * Utiliza API pública ViaCEP
 */

export interface CEPData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

class CEPService {
  private baseUrl = 'https://viacep.com.br/ws';

  /**
   * Busca dados do endereço pelo CEP
   */
  async buscarCEP(cep: string): Promise<CEPData | null> {
    try {
      // Remove formatação do CEP
      const cleanCep = cep.replace(/\D/g, '');

      // Valida se tem 8 dígitos
      if (cleanCep.length !== 8) {
        return null;
      }

      // Consulta na API ViaCEP (gratuita, sem necessidade de autenticação)
      const response = await fetch(`${this.baseUrl}/${cleanCep}/json/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data: CEPData = await response.json();

      // Verifica se a consulta foi bem-sucedida
      if (data.erro) {
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }

  /**
   * Formata CEP
   */
  formatCEP(cep: string): string {
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  }

  /**
   * Valida formato de CEP
   */
  validarCEP(cep: string): boolean {
    const clean = cep.replace(/\D/g, '');
    return clean.length === 8;
  }
}

export default new CEPService();

