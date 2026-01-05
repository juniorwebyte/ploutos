// Hook para usar configuração do ramo de atuação
import { useState, useEffect, useMemo } from 'react';
import { businessSegmentService } from '../services/businessSegmentService';
import { CompanyBusinessSegment, BusinessSegmentConfig } from '../types/businessSegment';

export const useBusinessSegment = () => {
  const [companySegment, setCompanySegment] = useState<CompanyBusinessSegment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSegment();
  }, []);

  const loadSegment = () => {
    try {
      const segment = businessSegmentService.getCompanySegment();
      if (!segment) {
        // Se não há segmento configurado, usar o padrão
        const generic = businessSegmentService.getSegmentByCode('COM_VAREJISTA_GENERICO');
        if (generic) {
          const newSegment = businessSegmentService.setCompanySegment(generic.id);
          setCompanySegment(newSegment);
        }
      } else {
        setCompanySegment(segment);
      }
    } catch (error) {
      console.error('Erro ao carregar segmento:', error);
    } finally {
      setLoading(false);
    }
  };

  const config: BusinessSegmentConfig | null = useMemo(() => {
    return companySegment?.config || null;
  }, [companySegment]);

  const nomenclaturas = useMemo(() => {
    return config?.nomenclaturas || {};
  }, [config]);

  const getTerm = (term: string): string => {
    return nomenclaturas[term] || term;
  };

  const categoriasEntradas = useMemo(() => {
    return config?.categoriasFinanceiras?.entradas || [];
  }, [config]);

  const categoriasSaidas = useMemo(() => {
    return config?.categoriasFinanceiras?.saidas || [];
  }, [config]);

  const tiposPagamento = useMemo(() => {
    return config?.tiposPagamento || [];
  }, [config]);

  const camposObrigatorios = useMemo(() => {
    return config?.camposObrigatorios || [];
  }, [config]);

  const validacoes = useMemo(() => {
    return config?.validacoes || [];
  }, [config]);

  const relatorios = useMemo(() => {
    return config?.relatorios || [];
  }, [config]);

  const funcionalidades = useMemo(() => {
    return config?.funcionalidades || [];
  }, [config]);

  const hasFuncionalidade = (codigo: string): boolean => {
    // Verificar se a funcionalidade está explicitamente configurada
    if (funcionalidades.some(f => f.codigo === codigo && f.ativa)) {
      return true;
    }
    
    // Verificação especial para VR/VA: habilitar automaticamente para segmentos de alimentação
    if (codigo === 'vr_va') {
      const categoriaAlimentacao = companySegment?.segment?.categoria === 'alimentacao_bebidas';
      return categoriaAlimentacao || false;
    }
    
    return false;
  };

  // Verificar se o ramo é alimentício
  const isRamoAlimenticio = useMemo(() => {
    return companySegment?.segment?.categoria === 'alimentacao_bebidas' || false;
  }, [companySegment]);

  // Verificar se uma forma de pagamento deve ser ocultada
  const isFormaPagamentoOculta = (codigo: string): boolean => {
    if (!companySegment) return false;
    
    // Se for ramo alimentício, ocultar certas formas de pagamento
    if (isRamoAlimenticio) {
      const formasOcultas = [
        'cartao_link',
        'boleto',
        'cheque',
        'taxa',
        'transportadora',
        'correios',
        'comissao_puxador'
      ];
      return formasOcultas.includes(codigo.toLowerCase());
    }
    
    // Se não for ramo alimentício, ocultar VR/VA
    if (!isRamoAlimenticio) {
      const formasOcultas = ['vale_refeicao', 'vale_alimentacao', 'vr', 'va'];
      return formasOcultas.includes(codigo.toLowerCase());
    }
    
    return false;
  };

  // Verificar se VR/VA deve ser exibido
  const deveExibirVRVA = useMemo(() => {
    return isRamoAlimenticio;
  }, [isRamoAlimenticio]);

  const refreshSegment = () => {
    loadSegment();
  };

  return {
    companySegment,
    config,
    nomenclaturas,
    getTerm,
    categoriasEntradas,
    categoriasSaidas,
    tiposPagamento,
    camposObrigatorios,
    validacoes,
    relatorios,
    funcionalidades,
    hasFuncionalidade,
    loading,
    refreshSegment,
    isRamoAlimenticio,
    isFormaPagamentoOculta,
    deveExibirVRVA
  };
};

