import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Search, Plus, FileText, Users, Building, CreditCard, Receipt } from 'lucide-react';
import axios from 'axios';
import backendService from '../services/backendService';
import CadernoNotas from './CadernoNotas';

type Subscription = {
  id: string;
  user: string;
  status: 'trial' | 'active' | 'expired';
  startAt: string;
  endAt?: string;
  key?: string;
};

interface AdminPanelProps {
  onBackToLanding?: () => void;
}

export default function AdminPanel({ onBackToLanding }: AdminPanelProps) {
  const [filter, setFilter] = useState('');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'organizacoes' | 'planos' | 'assinaturas' | 'caderno'>('usuarios');

  // Tenants state
  const [tenants, setTenants] = useState<any[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [associateUserId, setAssociateUserId] = useState<string>('');

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState<{ name: string; priceCents: number; interval: 'monthly' | 'yearly' }>({ name: '', priceCents: 0, interval: 'monthly' });

  // Subscriptions state
  const [subTenantId, setSubTenantId] = useState<string>('');
  const [subPlanId, setSubPlanId] = useState<string>('');

  const filtered = useMemo(() => subs.filter(s => s.user.toLowerCase().includes(filter.toLowerCase())), [subs, filter]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const online = await backendService.isOnline();
        if (!online) {
          // Fallback demo
          setSubs([
            { id: '1', user: 'demo', status: 'active', startAt: new Date().toISOString(), key: 'DEMO-KEY' },
            { id: '2', user: 'admin', status: 'active', startAt: new Date().toISOString(), key: 'ADMIN-KEY' },
          ]);
          return;
        }
        const base = backendService.getBaseUrl();
        const token = localStorage.getItem('auth_token');
        const { data } = await axios.get(`${base}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
        const mapped: Subscription[] = data.map((u: any) => ({
          id: u.id,
          user: u.username,
          status: u.license?.status || 'trial',
          startAt: u.license?.trialStart || new Date().toISOString(),
          endAt: u.license?.validUntil || undefined,
          key: u.license?.activationKey || ''
        }));
        setSubs(mapped);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const add = async () => {
    const username = prompt('Nome de usuário novo:');
    if (!username) return;
    try {
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      await axios.post(`${base}/api/users`, { username, password: 'changeme', role: 'user' }, { headers: { Authorization: `Bearer ${token}` } });
      await refresh();
    } catch (e) {
      alert('Falha ao criar usuário');
    }
  };

  const update = async (id: string, partial: Partial<Subscription>) => {
    const target = subs.find(s => s.id === id);
    if (!target) return;
    const next = subs.map(s => (s.id === id ? { ...s, ...partial } : s));
    setSubs(next);
    if (partial.key) {
      // visual only
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      const { data } = await axios.get(`${base}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      const mapped: Subscription[] = data.map((u: any) => ({
        id: u.id,
        user: u.username,
        status: u.license?.status || 'trial',
        startAt: u.license?.trialStart || new Date().toISOString(),
        endAt: u.license?.validUntil || undefined,
        key: u.license?.activationKey || ''
      }));
      setSubs(mapped);
    } catch (e: any) {
      setError(e?.message || 'Falha ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const online = await backendService.isOnline();
      if (!online) {
        setTenants([
          { id: 't1', name: 'Empresa Demo', users: [{id:'1'}], subscriptions: [{id:'s1'}] },
          { id: 't2', name: 'Webyte', users: [{id:'2'},{id:'3'}], subscriptions: [] },
        ]);
        return;
      }
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      const { data } = await axios.get(`${base}/api/tenants`, { headers: { Authorization: `Bearer ${token}` } });
      setTenants(data);
    } catch (e) {
      alert('Falha ao carregar tenants');
    }
  };

  const createTenant = async () => {
    if (!newTenantName) return;
    try {
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      await axios.post(`${base}/api/tenants`, { name: newTenantName }, { headers: { Authorization: `Bearer ${token}` } });
      setNewTenantName('');
      await loadTenants();
    } catch (e) {
      alert('Falha ao criar tenant');
    }
  };

  const associateUser = async () => {
    if (!selectedTenantId || !associateUserId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      await axios.post(`${base}/api/tenants/${selectedTenantId}/users`, { userId: associateUserId, role: 'owner' }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Usuário associado');
      setAssociateUserId('');
    } catch (e) {
      alert('Falha ao associar usuário');
    }
  };

  const loadPlans = async () => {
    try {
      // no GET /api/plans endpoint yet; we will mimic by listing from tenants subs
      // In a complete version, add GET /api/plans
    } catch {}
  };

  const createPlan = async () => {
    try {
      const online = await backendService.isOnline();
      if (!online) {
        alert('Plano criado (modo demo)');
        setNewPlan({ name: '', priceCents: 0, interval: 'monthly' });
        return;
      }
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      await axios.post(`${base}/api/plans`, newPlan, { headers: { Authorization: `Bearer ${token}` } });
      setNewPlan({ name: '', priceCents: 0, interval: 'monthly' });
      alert('Plano criado');
    } catch (e) {
      alert('Falha ao criar plano');
    }
  };

  const createSubscription = async () => {
    if (!subTenantId || !subPlanId) return;
    try {
      const online = await backendService.isOnline();
      if (!online) {
        alert('Assinatura criada (modo demo)');
        return;
      }
      const token = localStorage.getItem('auth_token');
      const base = backendService.getBaseUrl();
      await axios.post(`${base}/api/tenants/${subTenantId}/subscriptions`, { planId: subPlanId, status: 'active' }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Assinatura criada');
    } catch (e) {
      alert('Falha ao criar assinatura');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} className="group inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md">Atualizar</button>
            <button onClick={add} className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div><Plus className="w-4 h-4 relative z-10 group-hover:rotate-90 transition-transform"/> <span className="relative z-10">Usuário</span></button>
          </div>
          </div>

        <div className="mb-4 flex gap-2">
          {(['usuarios','organizacoes','planos','assinaturas','caderno'] as const).map(t => (
            <button key={t} onClick={()=>{
              setActiveTab(t);
              if (t==='organizacoes') loadTenants();
              if (t==='planos') loadPlans();
            }} className={`group px-3 py-1.5 rounded border flex items-center gap-2 transition-all duration-300 transform hover:scale-105 ${activeTab===t?'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg border-indigo-500':'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}>
              {t === 'usuarios' ? <><Users className="w-4 h-4"/> Usuários</> : 
               t === 'organizacoes' ? <><Building className="w-4 h-4"/> Organizações</> :
               t === 'planos' ? <><CreditCard className="w-4 h-4"/> Planos</> :
               t === 'assinaturas' ? <><Receipt className="w-4 h-4"/> Assinaturas</> :
               t === 'caderno' ? <><FileText className="w-4 h-4"/> Caderno de Notas</> : t}
            </button>
          ))}
        </div>

        {activeTab==='usuarios' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
            {loading && <div className="text-sm text-gray-500 mb-2 animate-pulse">Carregando...</div>}
            {error && <div className="text-sm text-red-600 mb-2 animate-fade-in">⚠️ {error}</div>}
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={filter} onChange={(e)=>setFilter(e.target.value)} placeholder="Buscar por usuário..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:border-indigo-300" />
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Usuário</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Início</th>
                  <th className="py-2 pr-3">Fim</th>
                  <th className="py-2 pr-3">Chave</th>
                    <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="py-2 pr-3"><input value={s.user} onChange={(e)=>update(s.id,{user:e.target.value})} className="px-2 py-1 border rounded"/></td>
                    <td className="py-2 pr-3">
                      <select value={s.status} onChange={(e)=>update(s.id,{status:e.target.value as any})} className="px-2 py-1 border rounded">
                        <option value="trial">Trial</option>
                        <option value="active">Ativa</option>
                        <option value="expired">Expirada</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3"><input type="datetime-local" value={s.startAt.slice(0,16)} onChange={(e)=>update(s.id,{startAt:new Date(e.target.value).toISOString()})} className="px-2 py-1 border rounded"/></td>
                    <td className="py-2 pr-3"><input type="datetime-local" value={(s.endAt||'').slice(0,16)} onChange={(e)=>update(s.id,{endAt:e.target.value?new Date(e.target.value).toISOString():undefined})} className="px-2 py-1 border rounded"/></td>
                    <td className="py-2 pr-3"><input value={s.key||''} onChange={(e)=>update(s.id,{key:e.target.value})} className="px-2 py-1 border rounded"/></td>
                    <td className="py-2 pr-3">
                        <select onChange={async (e)=>{
                          const token = localStorage.getItem('auth_token');
                          const base = backendService.getBaseUrl();
                          await axios.patch(`${base}/api/users/${s.id}/role`, { role: e.target.value }, { headers: { Authorization: `Bearer ${token}` } });
                          alert('Role atualizado');
                        }} className="px-2 py-1 border rounded" defaultValue={"user"}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <button onClick={async()=>{
                          const token = localStorage.getItem('auth_token');
                          const base = backendService.getBaseUrl();
                          await axios.post(`${base}/api/licenses/${encodeURIComponent(s.user)}/block`, {}, { headers: { Authorization: `Bearer ${token}` } });
                          alert('Licença bloqueada e chave gerada.');
                        }} className="px-3 py-1 text-white bg-amber-600 rounded mr-2">Bloquear/Gerar Chave</button>
                        <button onClick={async()=>{
                          const newPass = prompt('Nova senha:');
                          if (!newPass) return;
                          const token = localStorage.getItem('auth_token');
                          const base = backendService.getBaseUrl();
                          await axios.post(`${base}/api/users/${s.id}/reset-password`, { newPassword: newPass }, { headers: { Authorization: `Bearer ${token}` } });
                          alert('Senha redefinida');
                        }} className="px-3 py-1 text-white bg-slate-700 rounded">Resetar Senha</button>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-gray-500">Nenhum usuário</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab==='organizacoes' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
            <div className="flex gap-2 mb-3">
              <input value={newTenantName} onChange={(e)=>setNewTenantName(e.target.value)} placeholder="Nome da organização" className="px-3 py-2 border rounded"/>
              <button onClick={createTenant} className="px-3 py-2 bg-indigo-600 text-white rounded">Criar Organização</button>
              <button onClick={loadTenants} className="px-3 py-2 border rounded">Recarregar</button>
            </div>
            <div className="flex gap-2 mb-4">
              <select value={selectedTenantId} onChange={(e)=>setSelectedTenantId(e.target.value)} className="px-3 py-2 border rounded">
                <option value="">Selecione uma organização</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input value={associateUserId} onChange={(e)=>setAssociateUserId(e.target.value)} placeholder="ID do usuário para associar" className="px-3 py-2 border rounded"/>
              <button onClick={associateUser} className="px-3 py-2 bg-green-600 text-white rounded">Associar Usuário</button>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Nome</th>
                    <th className="py-2 pr-3">Usuários</th>
                    <th className="py-2 pr-3">Assinaturas</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="py-2 pr-3">{t.name}</td>
                      <td className="py-2 pr-3">{t.users?.length || 0}</td>
                      <td className="py-2 pr-3">{t.subscriptions?.length || 0}</td>
                    </tr>
                  ))}
                  {tenants.length===0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhum tenant</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab==='planos' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              <input value={newPlan.name} onChange={(e)=>setNewPlan(p=>({...p, name:e.target.value}))} placeholder="Nome do plano" className="px-3 py-2 border rounded"/>
              <input type="number" value={newPlan.priceCents} onChange={(e)=>setNewPlan(p=>({...p, priceCents:Number(e.target.value)||0}))} placeholder="Preço (centavos)" className="px-3 py-2 border rounded"/>
              <select value={newPlan.interval} onChange={(e)=>setNewPlan(p=>({...p, interval:e.target.value as any }))} className="px-3 py-2 border rounded">
                <option value="monthly">monthly</option>
                <option value="yearly">yearly</option>
              </select>
              <button onClick={createPlan} className="px-3 py-2 bg-indigo-600 text-white rounded">Criar Plano</button>
            </div>
            <div className="text-sm text-gray-500">Para listar planos, podemos adicionar GET /api/plans no backend em seguida.</div>
          </div>
        )}

        {activeTab==='assinaturas' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
              <input value={subTenantId} onChange={(e)=>setSubTenantId(e.target.value)} placeholder="ID da Organização" className="px-3 py-2 border rounded"/>
              <input value={subPlanId} onChange={(e)=>setSubPlanId(e.target.value)} placeholder="ID do Plano" className="px-3 py-2 border rounded"/>
              <button onClick={createSubscription} className="px-3 py-2 bg-green-600 text-white rounded">Criar Assinatura</button>
              <button onClick={loadTenants} className="px-3 py-2 border rounded">Recarregar Organizações</button>
            </div>
            <div className="text-sm text-gray-500">Use os IDs da organização e plano. Em seguida, podemos listar assinaturas por organização.</div>
          </div>
        )}

        {activeTab==='caderno' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CadernoNotas />
          </div>
        )}
      </div>
    </div>
  );
}


