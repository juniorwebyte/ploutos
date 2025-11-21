import React from 'react';
import { Clock, Phone, Mail, MessageCircle, X } from 'lucide-react';

interface DemoExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContact: () => void;
}

export default function DemoExpiredModal({ isOpen, onClose, onContact }: DemoExpiredModalProps) {
  if (!isOpen) return null;

  const handleWhatsAppContact = () => {
    const phoneNumber = '5511984801839'; // Número com código do país
    const message = 'Olá! Gostaria de saber mais sobre o Sistema de Movimento de Caixa da Webyte Desenvolvimentos.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onContact();
  };

  const handleEmailContact = () => {
    const email = 'junior@webytebr.com';
    const subject = 'Interesse no Sistema de Movimento de Caixa';
    const body = 'Olá! Gostaria de saber mais sobre o Sistema de Movimento de Caixa da Webyte Desenvolvimentos.';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    onContact();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white p-4 relative">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Demo Expirada</h1>
                <p className="text-orange-100 text-xs">Contate-nos para continuar!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">⏰</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Demo de 5 minutos finalizada!
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Gostou do que viu? Entre em contato para conhecer nossos planos.
            </p>
          </div>

          {/* Contact Options */}
          <div className="space-y-3">
            <button
              onClick={handleWhatsAppContact}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              onClick={handleEmailContact}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-semibold text-sm"
            >
              <Mail className="w-4 h-4" />
              E-mail
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-1 text-xs text-gray-600 text-center">
              <div className="flex items-center justify-center gap-1">
                <Phone className="w-3 h-3" />
                <span>(11) 98480-1839</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <Mail className="w-3 h-3" />
                <span>junior@webytebr.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t">
          <p className="text-center text-xs text-gray-500">
            <strong>Webyte Desenvolvimentos</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
