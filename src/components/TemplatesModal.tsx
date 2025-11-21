import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Trash2, Search, Plus, FileText } from 'lucide-react';
import { cashFlowTemplateService, ClosingTemplate } from '../services/cashFlowTemplateService';
import { formatCurrency } from '../utils/currency';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: ClosingTemplate) => void;
  currentData?: {
    entries: any;
    exits: any;
    cancelamentos?: any[];
  };
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  currentData
}) => {
  const [templates, setTemplates] = useState<ClosingTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = () => {
    const allTemplates = searchQuery
      ? cashFlowTemplateService.searchTemplates(searchQuery)
      : cashFlowTemplateService.getAllTemplates();
    setTemplates(allTemplates);
  };

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [searchQuery, isOpen]);

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim() || !currentData) return;

    const totalEntradas = Object.values(currentData.entries).reduce((sum: number, val: any) => {
      if (typeof val === 'number') return sum + val;
      if (Array.isArray(val)) return sum + val.reduce((s: number, v: any) => s + (Number(v.valor) || 0), 0);
      return sum;
    }, 0);

    const totalSaidas = Object.values(currentData.exits).reduce((sum: number, val: any) => {
      if (typeof val === 'number') return sum + val;
      if (Array.isArray(val)) return sum + val.reduce((s: number, v: any) => s + (Number(v.valor) || 0), 0);
      return sum;
    }, 0);

    cashFlowTemplateService.createTemplate(
      newTemplateName.trim(),
      currentData,
      newTemplateDescription.trim() || undefined,
      {
        totalEntradas,
        totalSaidas
      }
    );

    setNewTemplateName('');
    setNewTemplateDescription('');
    setShowCreateModal(false);
    loadTemplates();
  };

  const handleApplyTemplate = (template: ClosingTemplate) => {
    const applied = cashFlowTemplateService.applyTemplate(template.id);
    if (applied) {
      onApplyTemplate(applied);
      onClose();
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      cashFlowTemplateService.deleteTemplate(id);
      loadTemplates();
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-900">Templates de Fechamento</h2>
              <p className="text-xs text-gray-600">Salve e aplique configurações frequentes</p>
            </div>
            <div className="flex items-center gap-1">
              {currentData && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Novo
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Busca */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de Templates */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-xs mb-1">
                  {searchQuery ? 'Nenhum template encontrado' : 'Nenhum template salvo'}
                </p>
                <p className="text-gray-500 text-xs">
                  {!searchQuery && currentData && 'Clique em "Novo" para criar seu primeiro template'}
                </p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-gray-900 mb-0.5">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-gray-600 mb-1.5">
                          {template.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {template.metadata?.totalEntradas !== undefined && (
                          <div>
                            <span className="text-gray-600">Entradas:</span>
                            <span className="ml-1 font-semibold text-emerald-600">
                              {formatCurrency(template.metadata.totalEntradas)}
                            </span>
                          </div>
                        )}
                        {template.metadata?.totalSaidas !== undefined && (
                          <div>
                            <span className="text-gray-600">Saídas:</span>
                            <span className="ml-1 font-semibold text-red-600">
                              {formatCurrency(template.metadata.totalSaidas)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span>Criado: {formatDate(template.createdAt)}</span>
                        {template.lastUsed && (
                          <span>Usado: {formatDate(template.lastUsed)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Aplicar template"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Criar Novo Template</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nome do Template *
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ex: Fechamento Padrão"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Descreva quando usar este template..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim()}
                className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5 inline mr-1" />
                Salvar Template
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplatesModal;

