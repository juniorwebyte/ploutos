import React, { useState } from 'react';
import licenseService from '../services/licenseService';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitKey: (key: string) => Promise<string | null>; // retorna erro ou null se ok
}

export default function LicenseModal({ isOpen, onClose, onSubmitKey }: LicenseModalProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let err: string | null = null;
    // Tenta ativar via backend primeiro
    const updated = await licenseService.activateBackend(key);
    if (!updated) {
      err = await onSubmitKey(key);
    }
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Ativação Necessária</h3>
          <p className="text-sm text-gray-600 mt-1">Seu período de testes expirou. Insira a chave de ativação para continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave de Ativação</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="EX: 1A2B3C4D5E"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono tracking-widest"
              maxLength={16}
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">
              {loading ? 'Validando...' : 'Ativar'}
            </button>
          </div>
        </form>
        <div className="px-5 pb-5 text-xs text-gray-500">
          Caso não possua a chave, aguarde o contato do desenvolvedor via WhatsApp.
        </div>
      </div>
    </div>
  );
}


