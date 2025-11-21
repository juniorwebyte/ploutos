import { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Phone, 
  Mail,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Archive,
  Star,
  AlertCircle,
  Edit,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { chatService, ChatSession, ChatMessage } from '../services/chatService';
import { notificationService } from '../services/notificationService';

// Interfaces já importadas do chatService

export default function ChatManagement() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'João Silva',
      userEmail: 'joao@empresa.com',
      status: 'active',
      lastMessage: 'Preciso de ajuda com a configuração do sistema',
      lastActivity: new Date(),
      messageCount: 3,
      priority: 'high'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Maria Santos',
      userEmail: 'maria@loja.com',
      status: 'waiting',
      lastMessage: 'Qual o melhor plano para minha empresa?',
      lastActivity: new Date(Date.now() - 300000),
      messageCount: 1,
      priority: 'medium'
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Pedro Costa',
      userEmail: 'pedro@startup.com',
      status: 'closed',
      lastMessage: 'Obrigado pela ajuda!',
      lastActivity: new Date(Date.now() - 3600000),
      messageCount: 5,
      priority: 'low'
    }
  ]);

  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'waiting' | 'closed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Carregar dados do serviço de chat
  useEffect(() => {
    const loadData = () => {
      setSessions(chatService.getSessions());
    };

    loadData();
    
    // Subscrever para atualizações em tempo real
    const unsubscribe = chatService.subscribe((updatedSessions, updatedMessages) => {
      setSessions(updatedSessions);
      if (selectedSession) {
        setMessages(chatService.getSessionMessages(selectedSession.id));
      }
      
      // Criar notificação para novas sessões
      const newSessions = updatedSessions.filter(session => 
        session.status === 'waiting' && 
        !sessions.find(s => s.id === session.id)
      );
      
      newSessions.forEach(session => {
        notificationService.createNotification({
          type: 'chat',
          title: 'Nova Conversa de Chat',
          message: `${session.userName} iniciou uma conversa`,
          priority: 'high',
          category: 'chat',
          actionUrl: '#',
          actionText: 'Responder'
        });
      });
    });

    return unsubscribe;
  }, [selectedSession, sessions]);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || session.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedSession) return;

    // Enviar mensagem através do serviço
    chatService.sendMessage(selectedSession.id, newMessage, true, 'Admin');
    setNewMessage('');
  };

  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSession(session);
    // Carregar mensagens da sessão
    setMessages(chatService.getSessionMessages(session.id));
    // Marcar mensagens como lidas
    chatService.markMessagesAsRead(session.id);
    // Limpar edição
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditingMessageText(currentText);
  };

  const handleSaveEdit = () => {
    if (!selectedSession || !editingMessageId || !editingMessageText.trim()) return;
    
    chatService.editMessage(selectedSession.id, editingMessageId, editingMessageText);
    setMessages(chatService.getSessionMessages(selectedSession.id));
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      chatService.deleteSession(sessionId);
      setSessions(chatService.getSessions());
      if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    }
  };

  const handleToggleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = () => {
    if (selectedSessions.size === 0) return;
    
    if (confirm(`Tem certeza que deseja excluir ${selectedSessions.size} conversa(s)?`)) {
      selectedSessions.forEach(sessionId => {
        chatService.deleteSession(sessionId);
      });
      setSessions(chatService.getSessions());
      setSelectedSessions(new Set());
      setShowBulkActions(false);
      if (selectedSession && selectedSessions.has(selectedSession.id)) {
        setSelectedSession(null);
        setMessages([]);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header Compacto */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Chat Management</h2>
          </div>
          
          {/* Estatísticas Compactas */}
          <div className="flex gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-semibold text-gray-700">{sessions.filter(s => s.status === 'active').length}</span>
              <span className="text-gray-500">Ativas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="font-semibold text-gray-700">{sessions.filter(s => s.status === 'waiting').length}</span>
              <span className="text-gray-500">Aguardando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="font-semibold text-gray-700">{sessions.filter(s => s.status === 'closed').length}</span>
              <span className="text-gray-500">Fechadas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Lista de Sessões - Mais Compacta */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Filtros Compactos */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="all">Todos status</option>
                  <option value="active">Ativas</option>
                  <option value="waiting">Aguardando</option>
                  <option value="closed">Fechadas</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as any)}
                  className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="all">Todas prioridades</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ações em Lote */}
          {showBulkActions && (
            <div className="p-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-900">
                {selectedSessions.size} selecionada(s)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir
                </button>
                <button
                  onClick={() => {
                    setSelectedSessions(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista Compacta */}
          <div className="flex-1 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <>
                {filteredSessions.length > 0 && (
                  <div className="p-2 border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
                    >
                      {selectedSessions.size === filteredSessions.length ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      <span>Selecionar todas</span>
                    </button>
                  </div>
                )}
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className={`p-3 border-b border-gray-100 hover:bg-indigo-50 transition-colors ${
                      selectedSession?.id === session.id ? 'bg-indigo-100 border-indigo-300' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSessionSelection(session.id);
                        }}
                        className="mt-1 flex-shrink-0"
                      >
                        {selectedSessions.has(session.id) ? (
                          <CheckSquare className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      <div
                        onClick={() => handleSessionSelect(session)}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            session.status === 'active' ? 'bg-green-100' : 
                            session.status === 'waiting' ? 'bg-yellow-100' : 'bg-gray-100'
                          }`}>
                            <Users className={`h-4 w-4 ${
                              session.status === 'active' ? 'text-green-600' : 
                              session.status === 'waiting' ? 'text-yellow-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{session.userName}</h4>
                              <span className={`px-1.5 py-0.5 text-xs rounded ${getPriorityColor(session.priority)} flex-shrink-0`}>
                                {session.priority}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mb-1">{session.userEmail}</p>
                            <p className="text-xs text-gray-600 line-clamp-1">{session.lastMessage}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-xs text-gray-500">{session.messageCount} msgs</span>
                              <span className="text-xs text-gray-400">{session.lastActivity.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionSelect(session);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Abrir
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              ))}
            </>
            )}
          </div>
        </div>

        {/* Área de Conversa */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {selectedSession ? (
            <>
              {/* Header da Conversa */}
              <div className="bg-white border-b border-gray-200 p-3 sm:p-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{selectedSession.userName}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{selectedSession.userEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 text-xs sm:text-sm rounded-full ${getStatusColor(selectedSession.status)}`}>
                      {selectedSession.status}
                    </span>
                    <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.userName === 'Admin' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.userName !== 'Admin' && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.userName === 'Admin'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {editingMessageId === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Salvar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{message.message}</p>
                          <div className={`text-xs mt-1 flex items-center gap-2 flex-wrap ${
                            message.userName === 'Admin' ? 'text-indigo-100' : 'text-gray-500'
                          }`}>
                            <span>{message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {message.userName === 'Admin' && (
                              <>
                                <button 
                                  onClick={() => handleEditMessage(message.id, message.message)} 
                                  className="underline-offset-2 hover:underline flex items-center gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  editar
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
                                      chatService.deleteMessage(selectedSession!.id, message.id);
                                      setMessages(chatService.getSessionMessages(selectedSession!.id));
                                    }
                                  }} 
                                  className="underline-offset-2 hover:underline flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  remover
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {message.userName === 'Admin' && (
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-indigo-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Input - Área Fixa na Parte Inferior */}
              <div className="bg-white border-t border-gray-200 p-3 sm:p-4 flex-shrink-0">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Digite sua resposta..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-indigo-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0"
                    aria-label="Enviar mensagem"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </div>
                
                {/* Ações Rápidas - Compactas */}
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition-colors">
                    <Phone className="h-3 w-3" />
                    <span className="hidden sm:inline">Ligar</span>
                  </button>
                  <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition-colors">
                    <Mail className="h-3 w-3" />
                    <span className="hidden sm:inline">E-mail</span>
                  </button>
                  <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition-colors">
                    <Archive className="h-3 w-3" />
                    <span className="hidden sm:inline">Arquivar</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
                <p className="text-gray-500">Escolha uma conversa da lista para começar a responder</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
