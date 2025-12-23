/**
 * Gerenciamento de Filiais
 * CRUD completo de filiais com geolocalização e IPs autorizados
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Search,
  Building,
  Navigation,
  Globe,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  branchService,
  companyService,
  type Branch,
  type Company,
} from '../services/timeClockService';
import cepService from '../services/cepService';
import { validateCEP, formatCEP, validatePhone, formatPhone } from '../services/validationService';

interface BranchManagementProps {
  onBack?: () => void;
}

export default function BranchManagement({ onBack }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        await loadData();
      } catch (error) {
        if (isMounted) {
          console.error('Erro ao carregar dados:', error);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [filterCompany]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brs, comps] = await Promise.all([
        branchService.getAll(filterCompany || undefined).catch(() => []),
        companyService.getAll().catch(() => []),
      ]);
      setBranches(brs || []);
      setCompanies(comps || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setBranches([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBranch(null);
    setShowModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta filial?')) return;

    try {
      await branchService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir filial:', error);
      alert('Erro ao excluir filial');
    }
  };

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <MapPin className="w-8 h-8 text-emerald-600" />
            Gerenciamento de Filiais
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Cadastre e gerencie filiais com controle de geolocalização
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
            Nova Filial
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar filial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as empresas</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
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
                    Filial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Coordenadas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Raio (m)
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
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma filial encontrada
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {branch.name}
                          </div>
                          {branch.code && (
                            <div className="text-sm text-gray-500">Código: {branch.code}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {companies.find((c) => c.id === branch.companyId)?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {branch.address || '-'}
                        </div>
                        {branch.city && branch.state && (
                          <div className="text-sm text-gray-500">
                            {branch.city}, {branch.state}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {branch.latitude && branch.longitude ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não definido</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {branch.radius || 100}m
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            branch.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {branch.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(branch)}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(branch.id)}
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
        <BranchModal
          branch={editingBranch}
          companies={companies}
          onClose={() => {
            setShowModal(false);
            setEditingBranch(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingBranch(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface BranchModalProps {
  branch: Branch | null;
  companies: Company[];
  onClose: () => void;
  onSave: () => void;
}

function BranchModal({ branch, companies, onClose, onSave }: BranchModalProps) {
  const [formData, setFormData] = useState({
    companyId: branch?.companyId || '',
    name: branch?.name || '',
    code: branch?.code || '',
    address: branch?.address || '',
    city: branch?.city || '',
    state: branch?.state || '',
    zipCode: branch?.zipCode || '',
    latitude: branch?.latitude?.toString() || '',
    longitude: branch?.longitude?.toString() || '',
    radius: branch?.radius?.toString() || '100',
    authorizedIPs: (() => {
      if (!branch?.authorizedIPs) return '';
      if (Array.isArray(branch.authorizedIPs)) {
        return branch.authorizedIPs.join(', ');
      }
      if (typeof branch.authorizedIPs === 'string') {
        try {
          const parsed = JSON.parse(branch.authorizedIPs);
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
          return branch.authorizedIPs;
        } catch {
          return branch.authorizedIPs;
        }
      }
      return '';
    })(),
  });
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [validations, setValidations] = useState({
    cep: { isValid: true, message: '' },
    phone: { isValid: true, message: '' },
  });

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
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
              address: cepData.logradouro || formData.address,
              city: cepData.localidade || formData.city,
              state: cepData.uf || formData.state,
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
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo navegador');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        setGettingLocation(false);
      },
      (error) => {
        alert('Erro ao obter localização: ' + error.message);
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId) {
      alert('Selecione uma empresa');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('O nome da filial é obrigatório');
      return;
    }

    setSaving(true);

    try {
      // Preparar dados
      const data: any = {
        companyId: formData.companyId,
        name: formData.name.trim(),
      };
      
      // Campos opcionais
      data.code = formData.code?.trim() || null;
      data.address = formData.address?.trim() || null;
      data.city = formData.city?.trim() || null;
      data.state = formData.state?.trim() || null;
      data.zipCode = formData.zipCode?.trim() || null;
      
      // Coordenadas
      if (formData.latitude?.trim()) {
        const lat = parseFloat(formData.latitude);
        if (!isNaN(lat)) data.latitude = lat;
      }
      if (formData.longitude?.trim()) {
        const lng = parseFloat(formData.longitude);
        if (!isNaN(lng)) data.longitude = lng;
      }
      if (formData.radius?.trim()) {
        const rad = parseFloat(formData.radius);
        if (!isNaN(rad)) data.radius = rad;
      } else {
        data.radius = 100; // Valor padrão
      }
      
      // IPs autorizados
      if (formData.authorizedIPs?.trim()) {
        const ips = formData.authorizedIPs.split(',').map((ip) => ip.trim()).filter(ip => ip.length > 0);
        if (ips.length > 0) {
          data.authorizedIPs = JSON.stringify(ips);
        }
      }

      if (branch) {
        await branchService.update(branch.id, data);
      } else {
        await branchService.create(data);
      }
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar filial:', error);
      let errorMessage = 'Erro ao salvar filial';
      
      if (error?.message?.includes('conexão') || error?.code === 'ERR_NETWORK') {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando em http://localhost:4000';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        const errorDetails = error?.response?.data?.details;
        if (errorDetails) {
          errorMessage += `\n\nDetalhes: ${JSON.stringify(errorDetails, null, 2)}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
              {branch ? 'Editar Filial' : 'Nova Filial'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              type="button"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empresa *
                </label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Filial *
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
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
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
                    onChange={(e) => handleCEPChange(e.target.value)}
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

            {/* Geolocalização */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Geolocalização
                </h3>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Navigation className="w-4 h-4" />
                  {gettingLocation ? 'Obtendo...' : 'Usar Localização Atual'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Raio (metros)
                  </label>
                  <input
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* IPs Autorizados */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IPs Autorizados (separados por vírgula)
              </label>
              <input
                type="text"
                value={formData.authorizedIPs}
                onChange={(e) => setFormData({ ...formData, authorizedIPs: e.target.value })}
                placeholder="192.168.1.1, 10.0.0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco para permitir qualquer IP
              </p>
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

