// Serviço de Chat em Tempo Real
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'support' | 'sales' | 'technical';
  isFromAdmin: boolean;
  adminName?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'active' | 'waiting' | 'closed';
  lastMessage: string;
  lastActivity: Date;
  messageCount: number;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'support' | 'sales' | 'technical';
  createdAt: Date;
  assignedAdmin?: string;
}

class ChatService {
  private sessions: ChatSession[] = [];
  private messages: ChatMessage[] = [];
  private listeners: Array<(sessions: ChatSession[], messages: ChatMessage[]) => void> = [];

  constructor() {
    this.loadData();
    this.initializeMockData();
  }

  private loadData() {
    try {
      const savedSessions = localStorage.getItem('ploutos_chat_sessions');
      const savedMessages = localStorage.getItem('ploutos_chat_messages');
      
      if (savedSessions) {
        this.sessions = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          lastActivity: new Date(s.lastActivity),
          createdAt: new Date(s.createdAt)
        }));
      }
      
      if (savedMessages) {
        this.messages = JSON.parse(savedMessages).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (error) {
      // Erro ao carregar dados - retornar array vazio
    }
  }

  private saveData() {
    localStorage.setItem('ploutos_chat_sessions', JSON.stringify(this.sessions));
    localStorage.setItem('ploutos_chat_messages', JSON.stringify(this.messages));
  }

  private initializeMockData() {
    if (this.sessions.length === 0) {
      // Criar algumas sessões de exemplo
      const mockSessions: ChatSession[] = [
        {
          id: 'session_1',
          userId: 'user_1',
          userName: 'João Silva',
          userEmail: 'joao@email.com',
          status: 'active',
          lastMessage: 'Olá, gostaria de saber mais sobre os planos',
          lastActivity: new Date(),
          messageCount: 3,
          priority: 'medium',
          category: 'sales',
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          id: 'session_2',
          userId: 'user_2',
          userName: 'Maria Santos',
          userEmail: 'maria@email.com',
          status: 'waiting',
          lastMessage: 'Preciso de ajuda com o sistema',
          lastActivity: new Date(Date.now() - 1800000),
          messageCount: 1,
          priority: 'high',
          category: 'support',
          createdAt: new Date(Date.now() - 1800000)
        }
      ];

      this.sessions = mockSessions;
      this.saveData();
    }
  }

  // Subscrever para mudanças
  subscribe(listener: (sessions: ChatSession[], messages: ChatMessage[]) => void) {
    this.listeners.push(listener);
    
    // Notificar imediatamente com dados atuais
    listener(this.sessions, this.messages);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.sessions, this.messages));
    
    // Emitir evento customizado para notificações
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chatUpdate', {
        detail: { sessions: this.sessions, messages: this.messages }
      }));
    }
  }

  // Criar nova sessão de chat
  createSession(userName: string, userEmail: string, initialMessage: string): ChatSession {
    const sessionId = `session_${Date.now()}`;
    const userId = `user_${Date.now()}`;
    
    const newSession: ChatSession = {
      id: sessionId,
      userId,
      userName,
      userEmail,
      status: 'active',
      lastMessage: initialMessage,
      lastActivity: new Date(),
      messageCount: 1,
      priority: 'medium',
      category: 'general',
      createdAt: new Date()
    };

    this.sessions.unshift(newSession);

    // Criar mensagem inicial
    const initialChatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId,
      userName,
      userEmail,
      message: initialMessage,
      timestamp: new Date(),
      status: 'sent',
      priority: 'medium',
      category: 'general',
      isFromAdmin: false
    };

    this.messages.push(initialChatMessage);
    this.saveData();
    this.notifyListeners();

    return newSession;
  }

  // Enviar mensagem
  sendMessage(sessionId: string, message: string, isFromAdmin: boolean = false, adminName?: string): ChatMessage {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) throw new Error('Sessão não encontrada');

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId: session.userId,
      userName: isFromAdmin ? (adminName || 'Admin') : session.userName,
      userEmail: session.userEmail,
      message,
      timestamp: new Date(),
      status: 'sent',
      priority: session.priority,
      category: session.category,
      isFromAdmin,
      adminName
    };

    this.messages.push(newMessage);

    // Atualizar sessão
    session.lastMessage = message;
    session.lastActivity = new Date();
    session.messageCount++;
    session.status = 'active';

    this.saveData();
    this.notifyListeners();

    return newMessage;
  }

  // Editar mensagem por id
  editMessage(sessionId: string, messageId: string, newText: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    const msg = this.messages.find(m => m.id === messageId && m.userId === session.userId);
    if (!msg) return;
    msg.message = newText;
    msg.timestamp = new Date();
    this.saveData();
    this.notifyListeners();
  }

  // Excluir mensagem por id
  deleteMessage(sessionId: string, messageId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    this.messages = this.messages.filter(m => !(m.id === messageId && m.userId === session.userId));
    // atualizar contagem
    const count = this.messages.filter(m => m.userId === session.userId).length;
    session.messageCount = count;
    this.saveData();
    this.notifyListeners();
  }

  // Excluir conversa inteira
  deleteSession(sessionId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    this.messages = this.messages.filter(m => m.userId !== session.userId);
    this.saveData();
    this.notifyListeners();
  }

  // Obter sessões
  getSessions(): ChatSession[] {
    return [...this.sessions];
  }

  // Obter mensagens de uma sessão
  getSessionMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return [];

    return this.messages
      .filter(m => m.userId === session.userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Atualizar status da sessão
  updateSessionStatus(sessionId: string, status: 'active' | 'waiting' | 'closed') {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = status;
      this.saveData();
      this.notifyListeners();
    }
  }

  // Atribuir admin à sessão
  assignAdmin(sessionId: string, adminName: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.assignedAdmin = adminName;
      this.saveData();
      this.notifyListeners();
    }
  }

  // Marcar mensagens como lidas
  markMessagesAsRead(sessionId: string) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;

    this.messages
      .filter(m => m.userId === session.userId && !m.isFromAdmin)
      .forEach(m => m.status = 'read');

    this.saveData();
    this.notifyListeners();
  }

  // Obter estatísticas
  getStats() {
    const activeSessions = this.sessions.filter(s => s.status === 'active').length;
    const waitingSessions = this.sessions.filter(s => s.status === 'waiting').length;
    const closedSessions = this.sessions.filter(s => s.status === 'closed').length;
    const totalMessages = this.messages.length;
    const unreadMessages = this.messages.filter(m => m.status === 'sent' && !m.isFromAdmin).length;

    return {
      activeSessions,
      waitingSessions,
      closedSessions,
      totalMessages,
      unreadMessages,
      totalSessions: this.sessions.length
    };
  }

  // Filtrar sessões
  filterSessions(filters: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }) {
    let filtered = [...this.sessions];

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(s => s.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(s => s.category === filters.category);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s => 
        s.userName.toLowerCase().includes(search) ||
        s.userEmail.toLowerCase().includes(search) ||
        s.lastMessage.toLowerCase().includes(search)
      );
    }

    return filtered;
  }
}

export const chatService = new ChatService();
export default chatService;
