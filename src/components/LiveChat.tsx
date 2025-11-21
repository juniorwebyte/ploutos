import { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  User, 
  Bot, 
  Phone, 
  Mail,
  Clock,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2
} from 'lucide-react';
import aiService, { AIMessage } from '../services/aiService';
import { chatService, ChatMessage, ChatSession } from '../services/chatService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  intent?: string;
  confidence?: number;
  suggestedActions?: string[];
}

interface LiveChatProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function LiveChat({ isOpen, onToggle, isMinimized, onToggleMinimize }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou a assistente virtual da PloutosLedger. Como posso ajudá-lo hoje?',
      sender: 'ai',
      timestamp: new Date(),
      intent: 'greeting',
      confidence: 1.0,
      suggestedActions: ['Ver planos', 'Agendar demo', 'Falar com suporte']
    }
  ]);
  const [hasSentWelcomeMessage, setHasSentWelcomeMessage] = useState(false);

  // Enviar mensagem automática quando o chat for aberto pela primeira vez
  useEffect(() => {
    if (isOpen && !hasSentWelcomeMessage && messages.length === 1) {
      // Aguardar um pequeno delay para melhor UX
      const timer = setTimeout(() => {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: '👋 Olá! Bem-vindo ao PloutosLedger! 👋\n\nEu sou a assistente virtual e estou aqui para ajudar você a conhecer nosso sistema de gestão financeira.\n\n📊 Podemos falar sobre:\n• Recursos e funcionalidades\n• Planos e preços\n• Agendar uma demonstração\n• Dúvidas gerais\n\nComo posso ajudar você hoje?',
          sender: 'ai',
          timestamp: new Date(),
          intent: 'welcome',
          confidence: 1.0,
          suggestedActions: ['Ver planos', 'Agendar demo', 'Conhecer recursos']
        };
        setMessages(prev => [...prev, welcomeMessage]);
        setHasSentWelcomeMessage(true);
      }, 1500); // 1.5 segundos após abrir o chat

      return () => clearTimeout(timer);
    }
  }, [isOpen, hasSentWelcomeMessage, messages.length]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [showUserForm, setShowUserForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim(); // Salvar o texto antes de limpar

    // Criar sessão se não existir
    if (!currentSession) {
      if (!userInfo.name || !userInfo.email) {
        setShowUserForm(true);
        return;
      }
      
      const session = chatService.createSession(userInfo.name, userInfo.email, messageText);
      setCurrentSession(session);
      setShowUserForm(false);
    }

    // Enviar mensagem para o serviço de chat
    if (currentSession) {
      chatService.sendMessage(currentSession.id, messageText);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setAiProcessing(true);

    try {
      // Processar com IA usando o texto salvo
      const aiResponse = await aiService.processMessage(messageText);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.message,
        sender: 'ai',
        timestamp: new Date(),
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        suggestedActions: aiResponse.suggestedActions
      };

      setMessages(prev => [...prev, aiMessage]);

      // Se a IA sugere escalar para humano
      if (aiResponse.shouldEscalate) {
        setTimeout(() => {
          const escalationMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: 'Conectando você com nossa equipe de especialistas...',
            sender: 'admin',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, escalationMessage]);
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem com IA:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro. Conectando você com nossa equipe de suporte...',
        sender: 'admin',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
    }`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full absolute -top-1 -right-1"></div>
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Assistente IA</h3>
                <p className="text-xs text-indigo-100">
                  {isOnline ? 'Online agora' : 'Offline'}
                </p>
              </div>
            </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMinimize}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id}>
                  <div
                    className={`flex gap-3 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {(message.sender === 'admin' || message.sender === 'ai') && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.sender === 'ai' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-indigo-100'
                      }`}>
                        {message.sender === 'ai' ? (
                          <Sparkles className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-indigo-600 text-white'
                          : message.sender === 'ai'
                          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-gray-800 border border-purple-200'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-indigo-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        {message.sender === 'ai' && message.confidence && (
                          <span className="ml-2 text-purple-600">
                            ({Math.round(message.confidence * 100)}% confiança)
                          </span>
                        )}
                      </p>
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Ações Sugeridas pela IA */}
                  {message.sender === 'ai' && message.suggestedActions && message.suggestedActions.length > 0 && (
                    <div className="mt-2 ml-11">
                      <div className="flex flex-wrap gap-2">
                        {message.suggestedActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => setNewMessage(action)}
                            className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full hover:from-purple-600 hover:to-indigo-600 transition-all duration-200"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {aiProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl px-4 py-2 border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                      <span className="text-sm text-gray-700">IA processando...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulário de Usuário */}
            {showUserForm && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700 mb-3">
                  Para iniciar uma conversa, por favor, informe seus dados:
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={() => {
                      if (userInfo.name && userInfo.email) {
                        setShowUserForm(false);
                      }
                    }}
                    disabled={!userInfo.name || !userInfo.email}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Continuar Conversa
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || aiProcessing}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {aiProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  <Phone className="h-3 w-3" />
                  Ligar
                </button>
                <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  <Mail className="h-3 w-3" />
                  E-mail
                </button>
                <button className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                  <Clock className="h-3 w-3" />
                  Agendar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
