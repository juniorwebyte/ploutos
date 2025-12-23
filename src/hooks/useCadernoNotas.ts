import { useState, useEffect, useCallback, useMemo } from 'react';
import { NotaFiscal, CadernoNotasData } from '../types';
import { PerformanceUtils } from '../config/performance';

export function useCadernoNotas() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativa' | 'vencida' | 'quitada' | 'parcialmente_paga'>('todos');

  // Carregar dados do localStorage com cache e migração
  const loadData = useCallback(() => {
    return PerformanceUtils.cacheResult('cadernoNotasData', () => {
      // Tentar carregar de cadernoNotasData
      const savedData = localStorage.getItem('cadernoNotasData');
      let notas: NotaFiscal[] = savedData ? JSON.parse(savedData).notas || [] : [];
      
      // Migrar dados de ploutos_notas_fiscais se existir
      const oldData = localStorage.getItem('ploutos_notas_fiscais');
      if (oldData) {
        try {
          const oldNotas: NotaFiscal[] = JSON.parse(oldData);
          // Mesclar notas, evitando duplicatas por ID
          const existingIds = new Set(notas.map(n => n.id));
          const newNotas = oldNotas.filter(n => !existingIds.has(n.id));
          notas = [...notas, ...newNotas];
          
          // Salvar dados migrados
          if (newNotas.length > 0) {
            const dataToSave: CadernoNotasData = {
              notas,
              totalNotas: notas.length,
              valorTotal: notas.reduce((sum, nota) => sum + nota.total, 0),
              valorVencido: 0,
              valorVencendo: 0,
              dataUltimaAtualizacao: new Date().toISOString()
            };
            localStorage.setItem('cadernoNotasData', JSON.stringify(dataToSave));
          }
        } catch (e) {
          console.error('Erro ao migrar dados:', e);
        }
      }
      
      // Garantir que todas as notas tenham parcelas como array
      notas = notas.map(nota => ({
        ...nota,
        parcelas: nota.parcelas || []
      }));
      
      return { notas };
    });
  }, []);

  // Salvar dados no localStorage
  const saveData = useCallback((newNotas: NotaFiscal[]) => {
    const dataToSave: CadernoNotasData = {
      notas: newNotas,
      totalNotas: newNotas.length,
      valorTotal: newNotas.reduce((sum, nota) => sum + nota.total, 0),
      valorVencido: newNotas
        .filter(nota => nota.status === 'vencida')
        .reduce((sum, nota) => sum + nota.total, 0),
      valorVencendo: newNotas
        .filter(nota => {
          const hoje = new Date();
          const vencimento = new Date(nota.vencimento);
          const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
          return diffDays <= 7 && diffDays >= 0 && nota.status === 'ativa';
        })
        .reduce((sum, nota) => sum + nota.total, 0),
      dataUltimaAtualizacao: new Date().toISOString()
    };
    
    localStorage.setItem('cadernoNotasData', JSON.stringify(dataToSave));
    PerformanceUtils.clearCache(); // Limpar cache após salvar
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    const data = loadData();
    setNotas(data.notas || []);
  }, [loadData]);

  // Filtrar notas com memoização
  const filteredNotas = useMemo(() => {
    return PerformanceUtils.cacheResult(
      `filteredNotas_${searchTerm}_${filterStatus}_${notas.length}`,
      () => {
        let filtered = notas;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(nota =>
            nota.numeroNfe.toLowerCase().includes(term) ||
            nota.fabricacao.toLowerCase().includes(term)
          );
        }

        if (filterStatus !== 'todos') {
          filtered = filtered.filter(nota => nota.status === filterStatus);
        }

        return filtered;
      }
    );
  }, [notas, searchTerm, filterStatus]);

  // Calcular estatísticas com memoização
  const stats = useMemo(() => {
    return PerformanceUtils.cacheResult(
      `stats_${notas.length}_${notas.reduce((sum, nota) => sum + nota.total, 0)}`,
      () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        // Calcular parcelas
        let totalParcelas = 0;
        let parcelasPendentes = 0;
        let parcelasVencidas = 0;
        let parcelasPagas = 0;
        let valorParcelasPendentes = 0;
        let valorParcelasVencidas = 0;
        
        notas.forEach(nota => {
          if (nota.parcelas && nota.parcelas.length > 0) {
            totalParcelas += nota.parcelas.length;
            nota.parcelas.forEach(parcela => {
              if (parcela.status === 'paga') {
                parcelasPagas++;
              } else {
                parcelasPendentes++;
                valorParcelasPendentes += parcela.valor;
                
                const vencimento = new Date(parcela.dataVencimento);
                vencimento.setHours(0, 0, 0, 0);
                if (vencimento < hoje) {
                  parcelasVencidas++;
                  valorParcelasVencidas += parcela.valor;
                }
              }
            });
          }
        });
        
        // Calcular valor vencendo (próximos 7 dias)
        const valorVencendo = notas
          .filter(nota => {
            if (nota.parcelas && nota.parcelas.length > 0) {
              return nota.parcelas.some(p => {
                const vencimento = new Date(p.dataVencimento);
                vencimento.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
                return diffDays <= 7 && diffDays >= 0 && p.status === 'pendente';
              });
            }
            if (nota.vencimento) {
              const vencimento = new Date(nota.vencimento);
              vencimento.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
              return diffDays <= 7 && diffDays >= 0 && nota.status === 'ativa';
            }
            return false;
          })
          .reduce((sum, nota) => {
            if (nota.parcelas && nota.parcelas.length > 0) {
              return sum + nota.parcelas
                .filter(p => {
                  const vencimento = new Date(p.dataVencimento);
                  vencimento.setHours(0, 0, 0, 0);
                  const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
                  return diffDays <= 7 && diffDays >= 0 && p.status === 'pendente';
                })
                .reduce((s, p) => s + p.valor, 0);
            }
            return sum + nota.total;
          }, 0);
        
        return {
        total: notas.reduce((sum, nota) => sum + nota.total, 0),
        ativas: notas.filter(nota => nota.status === 'ativa').length,
        vencidas: notas.filter(nota => nota.status === 'vencida').length,
        quitadas: notas.filter(nota => nota.status === 'quitada').length,
          parcialmentePagas: notas.filter(nota => nota.status === 'parcialmente_paga').length,
        valorVencido: notas
          .filter(nota => nota.status === 'vencida')
            .reduce((sum, nota) => sum + nota.total, 0),
          valorVencendo,
          totalParcelas,
          parcelasPendentes,
          parcelasVencidas,
          parcelasPagas,
          valorParcelasPendentes,
          valorParcelasVencidas
        };
      }
    );
  }, [notas]);

  // Adicionar nota
  const addNota = useCallback((notaData: Omit<NotaFiscal, 'id' | 'dataCriacao' | 'dataAtualizacao'>) => {
    const nota: NotaFiscal = {
      ...notaData,
      id: `nota_${Date.now()}`,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    const newNotas = [...notas, nota];
    setNotas(newNotas);
    saveData(newNotas);
    return nota;
  }, [notas, saveData]);

  // Atualizar nota
  const updateNota = useCallback((id: string, updates: Partial<NotaFiscal>) => {
    const newNotas = notas.map(nota => 
      nota.id === id 
        ? { ...nota, ...updates, dataAtualizacao: new Date().toISOString() }
        : nota
    );
    setNotas(newNotas);
    saveData(newNotas);
  }, [notas, saveData]);

  // Excluir nota
  const deleteNota = useCallback((id: string) => {
    const newNotas = notas.filter(nota => nota.id !== id);
    setNotas(newNotas);
    saveData(newNotas);
  }, [notas, saveData]);

  // Alterar status
  const changeStatus = useCallback((id: string, status: 'ativa' | 'vencida' | 'quitada') => {
    updateNota(id, { status });
  }, [updateNota]);

  // Debounced search
  const debouncedSetSearchTerm = useCallback(
    PerformanceUtils.debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  return {
    notas,
    filteredNotas,
    stats,
    searchTerm,
    filterStatus,
    setSearchTerm: debouncedSetSearchTerm,
    setFilterStatus,
    addNota,
    updateNota,
    deleteNota,
    changeStatus,
    saveData
  };
}
