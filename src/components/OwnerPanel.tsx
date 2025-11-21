import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Building, MapPin, Phone, Mail, Globe, CreditCard, Palette, Settings, Upload, Check, Shield, RefreshCw, KeyRound, Calendar } from 'lucide-react';
import { CompanyConfig } from '../types';
import pixService from '../services/pixService';
import licenseService, { License } from '../services/licenseService';
import { useAuth } from '../contexts/AuthContext';
import { formatPhone, formatCEP, formatCNPJ, unformatPhone, unformatCEP, unformatCNPJ } from '../utils/formatters';

interface OwnerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdate: (config: CompanyConfig) => void;
}

export default function OwnerPanel({ isOpen, onClose, onConfigUpdate }: OwnerPanelProps) {
  const [config, setConfig] = useState<CompanyConfig>({
    id: '1',
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    inscricaoEstadual: '',
    endereco: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    contato: {
      telefone: '',
      email: '',
      site: ''
    },
    pix: {
      chave: '',
      tipo: 'telefone',
      banco: '',
      agencia: '',
      conta: ''
    },
    personalizacao: {
      corPrimaria: '#10b981',
      corSecundaria: '#059669',
      logo: '',
      favicon: ''
    },
    configuracao: {
      moeda: 'BRL',
      fusoHorario: 'America/Sao_Paulo',
      formatoData: 'DD/MM/YYYY',
      formatoHora: 'HH:mm'
    }
  });

  const [activeTab, setActiveTab] = useState<'empresa' | 'pix' | 'personalizacao' | 'configuracao' | 'licenca'>('empresa');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user, setLicense: setAuthLicense } = useAuth();
  const [license, setLicense] = useState<License | null>(null);
  const [validityDays, setValidityDays] = useState<number>(0);
  const [manualKey, setManualKey] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      carregarConfiguracao();
      carregarConfiguracoesVisuais();
      carregarLicenca();
    }
  }, [isOpen]);

  const carregarConfiguracao = async () => {
    try {
      const configAtual = await pixService.obterConfiguracao();
      setConfig(configAtual);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar configuração
      const configAtualizada = await pixService.atualizarConfiguracao(config);
      onConfigUpdate(configAtualizada);
      
      // Se estamos na aba de licença e há mudanças, salvar também
      if (activeTab === 'licenca' && license) {
        // A licença já foi atualizada pelos handlers específicos
        // Apenas garantir que está salva no localStorage
        localStorage.setItem('ploutos_license', JSON.stringify(license));
        // Atualizar contexto de autenticação
        if (setAuthLicense) {
          setAuthLicense(license as any);
        }
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      alert('Erro ao salvar configuração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const carregarLicenca = async () => {
    if (!user) {
      setLicense(null);
      return;
    }
    try {
      // Buscar licença do usuário atual
      const allLicenses = licenseService.getAllLicenses();
      const userLicense = allLicenses.find(l => 
        l.username === user || 
        l.userId === user || 
        l.email === user
      );
      
      if (userLicense) {
        setLicense(userLicense);
      } else {
        // Se não tem licença, criar uma pending
        const newLicense = licenseService.createLicense({
          userId: user,
          username: user,
          email: '',
          planId: 'p1',
          planName: 'Basic',
          status: 'pending',
          features: []
        });
        setLicense(newLicense);
        // Salvar no localStorage também
        localStorage.setItem('ploutos_license', JSON.stringify(newLicense));
      }
    } catch (e) {
      console.error('Erro ao carregar licença:', e);
      setLicense(null);
    }
  };

  const handleGenerateNewKey = async () => {
    if (!user) return;
    try {
      let currentLicense = license;
      
      // Se não tem licença, criar uma
      if (!currentLicense) {
        currentLicense = licenseService.createLicense({
          userId: user,
          username: user,
          email: '',
          planId: 'p1',
          planName: 'Basic',
          status: 'pending',
          features: []
        });
      }
      
      // Gerar nova chave usando o método correto
      const newKey = licenseService.generateLicenseKey();
      const updated = licenseService.updateLicense(currentLicense.id, {
        key: newKey,
        status: 'pending'
      });
      
      if (updated) {
        setLicense(updated);
        // Atualizar também no contexto de autenticação
        if (setAuthLicense) {
          setAuthLicense(updated as any);
        }
        // Salvar no localStorage
        localStorage.setItem('ploutos_license', JSON.stringify(updated));
        alert('Chave gerada com sucesso!');
      }
    } catch (e) {
      console.error('Erro ao gerar chave:', e);
      alert('Erro ao gerar chave');
    }
  };

  const handleActivate = () => {
    if (!user || !manualKey) {
      alert('Preencha a chave de ativação');
      return;
    }
    
    if (!license) {
      alert('Erro: Licença não encontrada. Clique em "Gerar/Reenviar chave" primeiro.');
      return;
    }
    
    try {
      // Validar a chave
      const validation = licenseService.validateLicense(manualKey);
      if (!validation.valid) {
        alert(`Chave inválida: ${validation.reason || 'Chave não encontrada'}`);
        return;
      }

      // Atualizar licença com base na chave validada
      const daysToAdd = validityDays > 0 ? validityDays : 365;
      const expiresAt = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
      
      const updated = licenseService.updateLicense(license.id, {
        status: 'active',
        key: manualKey,
        expiresAt: expiresAt,
        planId: validation.license?.planId || 'p1',
        planName: validation.license?.planName || 'Basic',
        features: validation.license?.features || []
      });

      if (updated) {
        setLicense(updated);
        // Atualizar também no contexto de autenticação
        if (setAuthLicense) {
          setAuthLicense(updated as any);
        }
        // Salvar no localStorage
        localStorage.setItem('ploutos_license', JSON.stringify(updated));
        alert('Licença ativada com sucesso!');
        // Recarregar a página para aplicar as mudanças
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert('Erro ao ativar licença');
      }
    } catch (e) {
      console.error('Erro ao ativar licença:', e);
      alert('Erro ao ativar licença');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CompanyConfig],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileUpload = (field: 'logo' | 'favicon', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleInputChange(`personalizacao.${field}`, result);
      
      // Aplicar imediatamente ao sistema
      if (field === 'logo') {
        aplicarLogo(result);
      } else if (field === 'favicon') {
        aplicarFavicon(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const aplicarLogo = (logoDataUrl: string) => {
    // Criar um elemento de imagem temporário para aplicar a logo
    const logoElement = document.querySelector('.company-logo') as HTMLImageElement;
    if (logoElement) {
      logoElement.src = logoDataUrl;
    }
    
    // Salvar no localStorage para persistência
    localStorage.setItem('companyLogo', logoDataUrl);
  };

  const aplicarFavicon = (faviconDataUrl: string) => {
    // Aplicar favicon dinamicamente
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = faviconDataUrl;
    } else {
      // Criar novo elemento favicon se não existir
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = faviconDataUrl;
      document.head.appendChild(newFavicon);
    }
    
    // Salvar no localStorage para persistência
    localStorage.setItem('companyFavicon', faviconDataUrl);
  };

  const carregarConfiguracoesVisuais = () => {
    // Carregar logo salva
    const logoSaved = localStorage.getItem('companyLogo');
    if (logoSaved) {
      aplicarLogo(logoSaved);
    }
    
    // Carregar favicon salvo
    const faviconSaved = localStorage.getItem('companyFavicon');
    if (faviconSaved) {
      aplicarFavicon(faviconSaved);
    }
  };

  const validarChavePIX = () => {
    return pixService.validarChavePIX(config.pix.chave, config.pix.tipo);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4 overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col my-auto">
        {/* Header - Fixo */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Building className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">Painel do Proprietário</h2>
                <p className="text-blue-100 text-sm sm:text-lg">Personalize seu sistema e gerencie configurações</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs - Fixo */}
        <div className="border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: 'empresa', label: 'Empresa', icon: Building },
              { id: 'pix', label: 'PIX', icon: CreditCard },
              { id: 'personalizacao', label: 'Personalização', icon: Palette },
              { id: 'configuracao', label: 'Configuração', icon: Settings },
              { id: 'licenca', label: 'Licença', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content - Scrollável */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(95vh - 280px)' }}>
          {activeTab === 'empresa' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    id="nomeFantasia"
                    value={config.nomeFantasia}
                    onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Nome da sua empresa"
                    required
                    aria-required="true"
                    aria-label="Nome fantasia da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    id="razaoSocial"
                    value={config.razaoSocial}
                    onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="Razão social completa"
                    required
                    aria-required="true"
                    aria-label="Razão social da empresa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    id="cnpj"
                    value={formatCNPJ(config.cnpj)}
                    onChange={(e) => {
                      const unformatted = unformatCNPJ(e.target.value);
                      handleInputChange('cnpj', unformatted);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                    aria-required="true"
                    aria-label="CNPJ da empresa"
                    pattern="[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inscrição Estadual
                  </label>
                  <input
                    type="text"
                    value={config.inscricaoEstadual}
                    onChange={(e) => handleInputChange('inscricaoEstadual', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logradouro *
                    </label>
                    <input
                      type="text"
                      value={config.endereco.logradouro}
                      onChange={(e) => handleInputChange('endereco.logradouro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Rua, Avenida, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      value={config.endereco.numero}
                      onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={config.endereco.complemento}
                      onChange={(e) => handleInputChange('endereco.complemento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Sala, Andar, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      value={config.endereco.bairro}
                      onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Centro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      value={config.endereco.cidade}
                      onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="São Paulo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select
                      value={config.endereco.estado}
                      onChange={(e) => handleInputChange('endereco.estado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecione</option>
                      <option value="AC">Acre</option>
                      <option value="AL">Alagoas</option>
                      <option value="AP">Amapá</option>
                      <option value="AM">Amazonas</option>
                      <option value="BA">Bahia</option>
                      <option value="CE">Ceará</option>
                      <option value="DF">Distrito Federal</option>
                      <option value="ES">Espírito Santo</option>
                      <option value="GO">Goiás</option>
                      <option value="MA">Maranhão</option>
                      <option value="MT">Mato Grosso</option>
                      <option value="MS">Mato Grosso do Sul</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PA">Pará</option>
                      <option value="PB">Paraíba</option>
                      <option value="PR">Paraná</option>
                      <option value="PE">Pernambuco</option>
                      <option value="PI">Piauí</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="RN">Rio Grande do Norte</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="RO">Rondônia</option>
                      <option value="RR">Roraima</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="SP">São Paulo</option>
                      <option value="SE">Sergipe</option>
                      <option value="TO">Tocantins</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP *
                    </label>
                    <input
                      type="text"
                      value={formatCEP(config.endereco.cep)}
                      onChange={(e) => {
                        const unformatted = unformatCEP(e.target.value);
                        handleInputChange('endereco.cep', unformatted);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={formatPhone(config.contato.telefone)}
                      onChange={(e) => {
                        const unformatted = unformatPhone(e.target.value);
                        handleInputChange('contato.telefone', unformatted);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      id="contato-email"
                      value={config.contato.email}
                      onChange={(e) => handleInputChange('contato.email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      placeholder="contato@empresa.com"
                      required
                      aria-required="true"
                      aria-label="Email de contato"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site
                    </label>
                    <input
                      type="url"
                      value={config.contato.site}
                      onChange={(e) => handleInputChange('contato.site', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pix' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Configuração PIX
                </h3>
                <p className="text-blue-800 text-sm">
                  Configure sua chave PIX para receber pagamentos reais. Certifique-se de que a chave está ativa em seu banco.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo da Chave PIX *
                  </label>
                  <select
                    value={config.pix.tipo}
                    onChange={(e) => handleInputChange('pix.tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="telefone">Telefone</option>
                    <option value="email">E-mail</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave PIX *
                  </label>
                  <input
                    type="text"
                    value={config.pix.chave}
                    onChange={(e) => handleInputChange('pix.chave', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      config.pix.chave && !validarChavePIX()
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Digite sua chave PIX"
                  />
                  {config.pix.chave && !validarChavePIX() && (
                    <p className="text-red-600 text-xs mt-1">Chave PIX inválida</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco
                  </label>
                  <input
                    type="text"
                    value={config.pix.banco}
                    onChange={(e) => handleInputChange('pix.banco', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Código do banco (ex: 341)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agência
                  </label>
                  <input
                    type="text"
                    value={config.pix.agencia}
                    onChange={(e) => handleInputChange('pix.agencia', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Número da agência"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conta
                  </label>
                  <input
                    type="text"
                    value={config.pix.conta}
                    onChange={(e) => handleInputChange('pix.conta', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Número da conta"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personalizacao' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Primária
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.personalizacao.corPrimaria}
                      onChange={(e) => handleInputChange('personalizacao.corPrimaria', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.personalizacao.corPrimaria}
                      onChange={(e) => handleInputChange('personalizacao.corPrimaria', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.personalizacao.corSecundaria}
                      onChange={(e) => handleInputChange('personalizacao.corSecundaria', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.personalizacao.corSecundaria}
                      onChange={(e) => handleInputChange('personalizacao.corSecundaria', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="#059669"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo da Empresa
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('logo', file);
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </label>
                    {config.personalizacao.logo && (
                      <img
                        src={config.personalizacao.logo}
                        alt="Logo"
                        className="w-12 h-12 object-contain border border-gray-300 rounded"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Favicon
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('favicon', file);
                      }}
                      className="hidden"
                      id="favicon-upload"
                    />
                    <label
                      htmlFor="favicon-upload"
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </label>
                    {config.personalizacao.favicon && (
                      <img
                        src={config.personalizacao.favicon}
                        alt="Favicon"
                        className="w-8 h-8 object-contain border border-gray-300 rounded"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'configuracao' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moeda
                  </label>
                  <select
                    value={config.configuracao.moeda}
                    onChange={(e) => handleInputChange('configuracao.moeda', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="BRL">Real Brasileiro (BRL)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuso Horário
                  </label>
                  <select
                    value={config.configuracao.fusoHorario}
                    onChange={(e) => handleInputChange('configuracao.fusoHorario', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                    <option value="America/Manaus">Manaus (UTC-4)</option>
                    <option value="America/Rio_Branco">Rio Branco (UTC-5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Data
                  </label>
                  <select
                    value={config.configuracao.formatoData}
                    onChange={(e) => handleInputChange('configuracao.formatoData', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                    <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                    <option value="YYYY-MM-DD">AAAA-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Hora
                  </label>
                  <select
                    value={config.configuracao.formatoHora}
                    onChange={(e) => handleInputChange('configuracao.formatoHora', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="HH:mm">24 horas (14:30)</option>
                    <option value="hh:mm A">12 horas (2:30 PM)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'licenca' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <div className="font-semibold">Gerenciamento de Licença</div>
                  <div>Controle de período de testes, ativação e validade da licença do usuário atual.</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-xl p-4">
                  <div className="text-sm text-gray-500">Usuário atual</div>
                  <div className="text-lg font-semibold">{user || '—'}</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className={`font-semibold ${license?.status === 'active' ? 'text-green-600' : license?.status === 'trial' ? 'text-blue-600' : 'text-red-600'}`}>{license?.status || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Chave atual</div>
                      <div className="font-mono break-all">{license?.key || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Criado em</div>
                      <div>{license?.createdAt ? new Date(license.createdAt).toLocaleString('pt-BR') : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Válido até</div>
                      <div>{license?.expiresAt ? new Date(license.expiresAt).toLocaleString('pt-BR') : '—'}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={carregarLicenca} className="px-3 py-2 border rounded-lg flex items-center gap-2 text-sm">
                      <RefreshCw className="w-4 h-4" /> Atualizar
                    </button>
                    <button onClick={handleGenerateNewKey} className="px-3 py-2 bg-gray-900 text-white rounded-lg flex items-center gap-2 text-sm">
                      <KeyRound className="w-4 h-4" /> Gerar/Reenviar chave
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">Ativar licença</div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Chave de ativação</label>
                      <input value={manualKey} onChange={(e) => setManualKey(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg font-mono" placeholder="1A2B3C4D5E" maxLength={16} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Validade (dias, opcional)</label>
                      <input type="number" min={0} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg" placeholder="0 = permanente" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleActivate} className="px-4 py-2 bg-green-600 text-white rounded-lg">Ativar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixo */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Configuração salva!</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Cancelar e fechar painel"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-initial px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label={saving ? "Salvando configurações" : "Salvar configurações"}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
