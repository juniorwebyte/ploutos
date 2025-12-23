/**
 * Gerenciamento de Empresas
 * CRUD completo de empresas
 */

import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  Search as SearchIcon,
} from 'lucide-react';
import {
  companyService,
  type Company,
} from '../services/timeClockService';
import { validateCNPJ, formatCNPJ, validatePhone, formatPhone, validateCEP, formatCEP } from '../services/validationService';
import { cnpjService } from '../services/cnpjService';
import cepService from '../services/cepService';

interface CompanyManagementProps {
  onBack?: () => void;
}

export default function CompanyManagement({ onBack }: CompanyManagementProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const comps = await companyService.getAll().catch(() => []);
      setCompanies(Array.isArray(comps) ? comps : []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setShowModal(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      await companyService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      alert('Erro ao excluir empresa');
    }
  };

  const filteredCompanies = companies.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building className="w-8 h-8 text-emerald-600" />
            Gerenciamento de Empresas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Cadastre e gerencie empresas do sistema
          </p>
        </div>
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Voltar
            </button>
          )}
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma empresa encontrada
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {company.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {company.cnpj || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {company.email || '-'}
                        </div>
                        {company.phone && (
                          <div className="text-sm text-gray-500">{company.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {company.city && company.state
                            ? `${company.city}, ${company.state}`
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            company.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {company.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CompanyModal
          company={editingCompany}
          onClose={() => {
            setShowModal(false);
            setEditingCompany(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingCompany(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface CompanyModalProps {
  company: Company | null;
  onClose: () => void;
  onSave: () => void;
}

function CompanyModal({ company, onClose, onSave }: CompanyModalProps) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    cnpj: company?.cnpj || '',
    email: company?.email || '',
    phone: company?.phone || '',
    address: company?.address || '',
    city: company?.city || '',
    state: company?.state || '',
    zipCode: company?.zipCode || '',
    isActive: company?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [validations, setValidations] = useState({
    cnpj: { isValid: true, message: '' },
    phone: { isValid: true, message: '' },
    cep: { isValid: true, message: '' },
  });
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('O nome da empresa é obrigatório');
      return;
    }

    setSaving(true);

    try {
      // Preparar dados - garantir que campos vazios sejam null ou undefined
      const data: any = {
        name: formData.name.trim(),
        isActive: formData.isActive ?? true,
      };
      
      // Campos opcionais - enviar null se vazio, ou o valor se preenchido
      data.cnpj = formData.cnpj?.trim() || null;
      data.email = formData.email?.trim() || null;
      data.phone = formData.phone?.trim() || null;
      data.address = formData.address?.trim() || null;
      data.city = formData.city?.trim() || null;
      data.state = formData.state?.trim() || null;
      data.zipCode = formData.zipCode?.trim() || null;

      if (company) {
        await companyService.update(company.id, data);
      } else {
        await companyService.create(data);
      }
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      alert(`Erro ao salvar: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4 modal-overlay"
      data-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ pointerEvents: 'auto', position: 'fixed' }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {company ? 'Editar Empresa' : 'Nova Empresa'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none w-8 h-8 flex items-center justify-center"
              type="button"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ
                  {formData.cnpj && (
                    <span className={`ml-2 text-xs ${validations.cnpj.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.cnpj.isValid ? '✓ Válido' : '✗ Inválido'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={async (e) => {
                      const formatted = formatCNPJ(e.target.value);
                      const cleanCNPJ = formatted.replace(/\D/g, '');
                      
                      // Atualizar o CNPJ no formData
                      setFormData((prev) => ({ ...prev, cnpj: formatted }));
                      
                      if (cleanCNPJ.length === 14) {
                        const isValid = validateCNPJ(formatted);
                        setValidations((prev) => ({
                          ...prev,
                          cnpj: {
                            isValid,
                            message: isValid ? '' : 'CNPJ inválido',
                          },
                        }));
                        
                        // Buscar automaticamente quando CNPJ for válido
                        if (isValid && !loadingCNPJ) {
                          console.log('🔍 Iniciando busca automática de CNPJ:', formatted);
                          setLoadingCNPJ(true);
                          try {
                            const cnpjData = await cnpjService.consultarCNPJ(formatted);
                            console.log('📦 Dados recebidos:', cnpjData);
                            
                            if (cnpjData) {
                              // Construir endereço completo
                              let enderecoCompleto = '';
                              if (cnpjData.logradouro) {
                                enderecoCompleto = cnpjData.logradouro;
                                if (cnpjData.numero) {
                                  enderecoCompleto += `, ${cnpjData.numero}`;
                                }
                                if (cnpjData.complemento) {
                                  enderecoCompleto += ` - ${cnpjData.complemento}`;
                                }
                                if (cnpjData.bairro) {
                                  enderecoCompleto += `, ${cnpjData.bairro}`;
                                }
                              }
                              
                              setFormData((prev) => {
                                const updated = {
                                  ...prev,
                                  cnpj: formatted,
                                  name: prev.name || cnpjData.nome_fantasia || cnpjData.razao_social || '',
                                  address: prev.address || enderecoCompleto || '',
                                  city: prev.city || cnpjData.municipio || '',
                                  state: prev.state || cnpjData.uf || '',
                                  zipCode: prev.zipCode || (cnpjData.cep ? formatCEP(cnpjData.cep) : '') || '',
                                  phone: prev.phone || cnpjData.telefone || '',
                                  email: prev.email || cnpjData.email || '',
                                };
                                console.log('✅ FormData atualizado:', updated);
                                return updated;
                              });
                              
                              // Mostrar notificação de sucesso
                              setTimeout(() => {
                                alert('✅ Dados da empresa preenchidos automaticamente!');
                              }, 100);
                            } else {
                              console.warn('⚠️ CNPJ não encontrado na API');
                              setValidations((prev) => ({
                                ...prev,
                                cnpj: {
                                  isValid: true,
                                  message: 'CNPJ válido, mas não encontrado na base de dados',
                                },
                              }));
                            }
                          } catch (error: any) {
                            console.error('❌ Erro ao buscar CNPJ:', error);
                            alert('Erro ao buscar dados do CNPJ. Tente novamente ou preencha manualmente.');
                          } finally {
                            setLoadingCNPJ(false);
                          }
                        }
                      } else {
                        setValidations((prev) => ({
                          ...prev,
                          cnpj: { isValid: true, message: '' },
                        }));
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                    className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                      formData.cnpj && !validations.cnpj.isValid
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {loadingCNPJ && (
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg cursor-not-allowed"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </button>
                  )}
                  {formData.cnpj && validateCNPJ(formData.cnpj) && !loadingCNPJ && (
                    <button
                      type="button"
                      onClick={async () => {
                        setLoadingCNPJ(true);
                        try {
                          const cnpjData = await cnpjService.consultarCNPJ(formData.cnpj);
                          if (cnpjData) {
                            setFormData({
                              ...formData,
                              name: formData.name || cnpjData.nome_fantasia || cnpjData.razao_social || formData.name,
                              address: formData.address || cnpjData.logradouro || formData.address,
                              city: formData.city || cnpjData.municipio || formData.city,
                              state: formData.state || cnpjData.uf || formData.state,
                              zipCode: formData.zipCode || cnpjData.cep || formData.zipCode,
                              phone: formData.phone || cnpjData.telefone || formData.phone,
                              email: formData.email || cnpjData.email || formData.email,
                            });
                          } else {
                            alert('CNPJ não encontrado ou inválido');
                          }
                        } catch (error) {
                          console.error('Erro ao buscar CNPJ:', error);
                          alert('Erro ao buscar dados do CNPJ');
                        } finally {
                          setLoadingCNPJ(false);
                        }
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                      title="Buscar dados da empresa pelo CNPJ"
                    >
                      <SearchIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {!validations.cnpj.isValid && formData.cnpj && (
                  <p className="text-xs text-red-600 mt-1">{validations.cnpj.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                  {formData.phone && (
                    <span className={`ml-2 text-xs ${validations.phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.phone.isValid ? '✓ Válido' : '✗ Inválido'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                    if (formatted.replace(/\D/g, '').length >= 10) {
                      const isValid = validatePhone(formatted);
                      setValidations({
                        ...validations,
                        phone: {
                          isValid,
                          message: isValid ? '' : 'Telefone inválido (formato: (00) 0000-0000 ou (00) 00000-0000)',
                        },
                      });
                    } else {
                      setValidations({
                        ...validations,
                        phone: { isValid: true, message: '' },
                      });
                    }
                  }}
                  placeholder="(00) 00000-0000"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                    formData.phone && !validations.phone.isValid
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {!validations.phone.isValid && formData.phone && (
                  <p className="text-xs text-red-600 mt-1">{validations.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CEP
                  {formData.zipCode && formData.zipCode.replace(/\D/g, '').length === 8 && (
                    <span className={`ml-2 text-xs ${validations.cep.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.cep.isValid ? '✓ Válido' : '✗ Inválido'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={async (e) => {
                      const cleanCEP = e.target.value.replace(/\D/g, '');
                      const cep = cleanCEP.length <= 8 ? cleanCEP : cleanCEP.substring(0, 8);
                      const formattedCEP = formatCEP(cep);
                      setFormData({ ...formData, zipCode: formattedCEP });
                      
                      if (cleanCEP.length === 8) {
                        const isValid = validateCEP(formattedCEP);
                        setValidations({
                          ...validations,
                          cep: {
                            isValid,
                            message: isValid ? '' : 'CEP inválido',
                          },
                        });
                        
                        if (isValid) {
                          setLoadingCEP(true);
                          try {
                            const cepData = await cepService.buscarCEP(formattedCEP);
                            if (cepData) {
                              setFormData({
                                ...formData,
                                zipCode: formattedCEP,
                                address: formData.address || cepData.logradouro || '',
                                city: formData.city || cepData.localidade || '',
                                state: formData.state || cepData.uf || '',
                              });
                            } else {
                              setValidations({
                                ...validations,
                                cep: {
                                  isValid: false,
                                  message: 'CEP não encontrado',
                                },
                              });
                            }
                          } catch (error) {
                            console.error('Erro ao buscar CEP:', error);
                            setValidations({
                              ...validations,
                              cep: {
                                isValid: false,
                                message: 'Erro ao buscar CEP',
                              },
                            });
                          } finally {
                            setLoadingCEP(false);
                          }
                        }
                      } else {
                        setValidations({
                          ...validations,
                          cep: { isValid: true, message: '' },
                        });
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 pr-10 ${
                      formData.zipCode && formData.zipCode.replace(/\D/g, '').length === 8 && !validations.cep.isValid
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {loadingCEP && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>
                {!validations.cep.isValid && formData.zipCode && formData.zipCode.replace(/\D/g, '').length === 8 && (
                  <p className="text-xs text-red-600 mt-1">{validations.cep.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Digite o CEP para preencher automaticamente o endereço
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Empresa ativa
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

