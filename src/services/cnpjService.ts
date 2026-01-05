/**
 * Serviço de Consulta de CNPJ
 * Busca dados da empresa pelo CNPJ usando API pública
 */

import axios from 'axios';

export interface CNPJData {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string;
  situacao?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  capital_social?: number;
  data_abertura?: string;
  natureza_juridica?: string;
  porte?: string;
}

class CNPJService {
  private baseUrl = 'https://www.receitaws.com.br/v1';
  private alternativeUrl = 'https://brasilapi.com.br/api/cnpj/v1';

  async consultarCNPJ(cnpj: string): Promise<CNPJData | null> {
    try {
      const cleanCNPJ = cnpj.replace(/\D/g, '');
      if (cleanCNPJ.length !== 14) {
        console.warn('CNPJ deve ter 14 dígitos:', cleanCNPJ);
        return null;
      }

      console.log('🔍 Buscando CNPJ:', cleanCNPJ);

      // Tentar primeiro com ReceitaWS
      try {
        const response = await axios.get<any>(`${this.baseUrl}/${cleanCNPJ}`, {
          timeout: 15000,
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log('📦 Resposta da ReceitaWS:', response.data);

        // Verificar se há erro na resposta
        if (response.data.status === 'ERROR' || response.data.situacao === 'ERROR' || !response.data.cnpj) {
          console.warn('CNPJ não encontrado na ReceitaWS, tentando API alternativa...');
          throw new Error('CNPJ não encontrado');
        }

        // Mapear dados da API para nosso formato
        const data: CNPJData = {
          cnpj: response.data.cnpj || cleanCNPJ,
          razao_social: response.data.nome || response.data.razao_social || '',
          nome_fantasia: response.data.fantasia || response.data.nome_fantasia || '',
          situacao: response.data.situacao || response.data.status || '',
          logradouro: response.data.logradouro || '',
          numero: response.data.numero || '',
          complemento: response.data.complemento || '',
          bairro: response.data.bairro || '',
          municipio: response.data.municipio || response.data.cidade || '',
          uf: response.data.uf || response.data.estado || '',
          cep: response.data.cep ? response.data.cep.replace(/\D/g, '') : '',
          telefone: response.data.telefone || response.data.phone || '',
          email: response.data.email || '',
          capital_social: response.data.capital_social || 0,
          data_abertura: response.data.abertura || response.data.data_abertura || '',
          natureza_juridica: response.data.natureza_juridica || '',
          porte: response.data.porte || '',
        };

        console.log('✅ Dados mapeados da ReceitaWS:', data);
        return data;
      } catch (primaryError: any) {
        console.warn('⚠️ Erro na ReceitaWS, tentando BrasilAPI...', primaryError.message);
        
        // Tentar API alternativa (BrasilAPI)
        try {
          const response = await axios.get<any>(`${this.alternativeUrl}/${cleanCNPJ}`, {
            timeout: 15000,
            headers: {
              'Accept': 'application/json',
            },
          });

          console.log('📦 Resposta da BrasilAPI:', response.data);

          if (!response.data || response.data.cnpj !== cleanCNPJ) {
            console.warn('CNPJ não encontrado na BrasilAPI');
            return null;
          }

          // Mapear dados da BrasilAPI para nosso formato
          const data: CNPJData = {
            cnpj: response.data.cnpj || cleanCNPJ,
            razao_social: response.data.razao_social || response.data.nome || '',
            nome_fantasia: response.data.nome_fantasia || response.data.fantasia || '',
            situacao: response.data.descricao_situacao_cadastral || '',
            logradouro: response.data.logradouro || '',
            numero: response.data.numero || '',
            complemento: response.data.complemento || '',
            bairro: response.data.bairro || '',
            municipio: response.data.municipio || '',
            uf: response.data.uf || '',
            cep: response.data.cep ? response.data.cep.replace(/\D/g, '') : '',
            telefone: response.data.ddd_telefone_1 || response.data.telefone || '',
            email: response.data.email || '',
            capital_social: response.data.capital_social || 0,
            data_abertura: response.data.data_inicio_atividade || '',
            natureza_juridica: response.data.natureza_juridica || '',
            porte: response.data.porte || '',
          };

          console.log('✅ Dados mapeados da BrasilAPI:', data);
          return data;
        } catch (alternativeError: any) {
          console.error('❌ Erro na BrasilAPI:', alternativeError);
          throw alternativeError;
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao consultar CNPJ:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return null;
    }
  }
}

export const cnpjService = new CNPJService();
