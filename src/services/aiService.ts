// Serviço de IA Aprimorado para Chat
export interface AIMessage {
  message: string;
  intent: string;
  confidence: number;
  suggestedActions: string[];
  shouldEscalate: boolean;
  context?: any;
  entities?: any[];
}

class AIService {
  private contextHistory: Map<string, any[]> = new Map();
  private userPreferences: Map<string, any> = new Map();

  constructor() {
    this.loadContextHistory();
    this.loadUserPreferences();
  }

  private loadContextHistory() {
    try {
      const saved = localStorage.getItem('ploutos_ai_context');
      if (saved) {
        this.contextHistory = new Map(JSON.parse(saved));
      }
    } catch (error) {
      // Erro ao carregar histórico - retornar array vazio
    }
  }

  private saveContextHistory() {
    localStorage.setItem('ploutos_ai_context', JSON.stringify([...this.contextHistory]));
  }

  private loadUserPreferences() {
    try {
      const saved = localStorage.getItem('ploutos_ai_preferences');
      if (saved) {
        this.userPreferences = new Map(JSON.parse(saved));
      }
    } catch (error) {
      // Erro ao carregar preferências - usar padrão
    }
  }

  private saveUserPreferences() {
    localStorage.setItem('ploutos_ai_preferences', JSON.stringify([...this.userPreferences]));
  }

  // Processar mensagem com IA aprimorada
  async processMessage(message: string, userId?: string): Promise<AIMessage> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Obter contexto do usuário
    const userContext = userId ? this.contextHistory.get(userId) || [] : [];
    const userPrefs = userId ? this.userPreferences.get(userId) || {} : {};

    // Detectar intenção com maior precisão
    const intent = this.detectIntent(normalizedMessage, userContext);
    const confidence = this.calculateConfidence(normalizedMessage, intent);
    
    // Extrair entidades
    const entities = this.extractEntities(normalizedMessage);
    
    // Gerar resposta contextual
    const response = this.generateContextualResponse(intent, confidence, entities, userContext, userPrefs);
    
    // Determinar se deve escalar
    const shouldEscalate = this.shouldEscalateToHuman(intent, confidence, userContext);
    
    // Atualizar contexto
    if (userId) {
      const newContext = [...userContext, { message, intent, timestamp: new Date() }].slice(-10);
      this.contextHistory.set(userId, newContext);
      this.saveContextHistory();
    }

    return {
      message: response.message,
      intent,
      confidence,
      suggestedActions: response.suggestedActions,
      shouldEscalate,
      context: userContext,
      entities
    };
  }

  private detectIntent(message: string, context: any[]): string {
    // Padrões de intenção mais sofisticados
    const intentPatterns = {
      'saudacao': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hi'],
      'despedida': ['tchau', 'até logo', 'até mais', 'bye', 'até breve'],
      'planos': ['planos', 'preços', 'assinatura', 'pagamento', 'custo', 'valor', 'quanto custa'],
      'demo': ['demo', 'teste', 'experimentar', 'provar', 'testar', 'demonstração'],
      'suporte': ['ajuda', 'problema', 'erro', 'bug', 'não funciona', 'dificuldade', 'suporte'],
      'funcionalidades': ['funcionalidades', 'recursos', 'o que faz', 'como funciona', 'capacidades'],
      'caderno_notas': ['caderno', 'notas', 'fiscal', 'nfe', 'parcelas', 'pagamentos'],
      'integracao': ['integração', 'conectar', 'api', 'webhook', 'sincronizar'],
      'seguranca': ['segurança', 'dados', 'privacidade', 'criptografia', 'proteção'],
      'cancelamento': ['cancelar', 'desistir', 'parar', 'sair', 'remover'],
      'upgrade': ['upgrade', 'melhorar', 'avançar', 'premium', 'pro'],
      'faturamento': ['fatura', 'cobrança', 'pagamento', 'cartão', 'boleto', 'pix']
    };

    // Verificar padrões diretos
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => message.includes(pattern))) {
        return intent;
      }
    }

    // Análise contextual baseada no histórico
    if (context.length > 0) {
      const lastIntent = context[context.length - 1]?.intent;
      
      // Continuar conversa baseada no contexto
      if (lastIntent === 'planos' && (message.includes('sim') || message.includes('quero'))) {
        return 'interesse_plano';
      }
      
      if (lastIntent === 'demo' && (message.includes('sim') || message.includes('quero'))) {
        return 'iniciar_demo';
      }
    }

    // Análise de sentimento básica
    const positiveWords = ['bom', 'ótimo', 'excelente', 'perfeito', 'gostei', 'legal'];
    const negativeWords = ['ruim', 'péssimo', 'terrível', 'não gostei', 'problema'];
    
    if (positiveWords.some(word => message.includes(word))) {
      return 'feedback_positivo';
    }
    
    if (negativeWords.some(word => message.includes(word))) {
      return 'feedback_negativo';
    }

    return 'geral';
  }

  private calculateConfidence(message: string, intent: string): number {
    // Calcular confiança baseada na clareza da intenção
    const intentPatterns = {
      'saudacao': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite'],
      'planos': ['planos', 'preços', 'assinatura', 'pagamento'],
      'demo': ['demo', 'teste', 'experimentar'],
      'suporte': ['ajuda', 'problema', 'erro', 'bug']
    };

    const patterns = intentPatterns[intent as keyof typeof intentPatterns];
    if (patterns) {
      const matches = patterns.filter(pattern => message.includes(pattern)).length;
      return Math.min(0.9, 0.5 + (matches * 0.1));
    }

    return 0.6; // Confiança padrão
  }

  private extractEntities(message: string): any[] {
    const entities = [];
    
    // Extrair números (preços, quantidades)
    const numbers = message.match(/\d+/g);
    if (numbers) {
      entities.push({ type: 'number', values: numbers });
    }
    
    // Extrair emails
    const emails = message.match(/[^\s]+@[^\s]+/g);
    if (emails) {
      entities.push({ type: 'email', values: emails });
    }
    
    // Extrair palavras-chave importantes
    const keywords = ['urgente', 'importante', 'rápido', 'hoje', 'agora'];
    const foundKeywords = keywords.filter(keyword => message.includes(keyword));
    if (foundKeywords.length > 0) {
      entities.push({ type: 'keyword', values: foundKeywords });
    }

    return entities;
  }

  private generateContextualResponse(intent: string, confidence: number, entities: any[], context: any[], userPrefs: any): { message: string; suggestedActions: string[] } {
    const responses = {
      'saudacao': {
        message: 'Olá! 👋 Sou a assistente virtual da PloutosLedger. Como posso ajudá-lo hoje?',
        suggestedActions: ['Ver planos', 'Agendar demo', 'Falar com suporte', 'Conhecer funcionalidades']
      },
      'planos': {
        message: 'Temos planos flexíveis para atender diferentes necessidades! 💰\n\n• **Basic** (R$ 9,99/mês) - Ideal para pequenos negócios\n• **Starter** (R$ 29,99/mês) - Recursos completos\n• **Pro** (R$ 59,99/mês) - Para empresas em crescimento\n\nQual plano mais se adequa ao seu perfil?',
        suggestedActions: ['Ver detalhes do Basic', 'Ver detalhes do Starter', 'Ver detalhes do Pro', 'Falar com vendas']
      },
      'demo': {
        message: 'Perfeito! 🎯 Você pode testar nosso sistema gratuitamente por 5 minutos.\n\nO que gostaria de experimentar primeiro?\n• Caderno de Notas com parcelas\n• Sistema de relatórios\n• Interface completa',
        suggestedActions: ['Iniciar demo', 'Ver funcionalidades', 'Agendar apresentação']
      },
      'suporte': {
        message: 'Entendo que você precisa de ajuda! 🤝\n\nPosso ajudá-lo com:\n• Problemas técnicos\n• Dúvidas sobre funcionalidades\n• Configurações\n• Integrações\n\nDescreva melhor o problema para eu poder ajudá-lo.',
        suggestedActions: ['Problema técnico', 'Dúvida sobre funcionalidade', 'Falar com humano']
      },
      'caderno_notas': {
        message: 'O Caderno de Notas é uma de nossas funcionalidades mais poderosas! 📊\n\nVocê pode:\n• Gerenciar notas fiscais\n• Controlar parcelas e vencimentos\n• Gerar relatórios profissionais\n• Acompanhar pagamentos\n\nGostaria de ver uma demonstração?',
        suggestedActions: ['Ver demo', 'Ver preços', 'Falar com especialista']
      },
      'feedback_positivo': {
        message: 'Que ótimo saber que você está satisfeito! 😊\n\nIsso nos motiva a continuar melhorando nossos serviços. Há algo específico que você gostaria de destacar ou alguma sugestão de melhoria?',
        suggestedActions: ['Deixar avaliação', 'Compartilhar experiência', 'Conhecer mais recursos']
      },
      'feedback_negativo': {
        message: 'Lamento saber que algo não atendeu suas expectativas. 😔\n\nSua opinião é muito importante para nós. Poderia me contar mais detalhes sobre o que não funcionou bem? Assim posso ajudá-lo melhor.',
        suggestedActions: ['Descrever problema', 'Falar com supervisor', 'Solicitar reembolso']
      },
      'geral': {
        message: 'Entendi sua mensagem! 🤔\n\nPara te ajudar melhor, você poderia me dizer se está interessado em:\n• Conhecer nossos planos\n• Testar o sistema\n• Resolver alguma dúvida\n• Falar com nossa equipe',
        suggestedActions: ['Ver planos', 'Fazer demo', 'Falar com suporte', 'Conhecer funcionalidades']
      }
    };

    const response = responses[intent as keyof typeof responses] || responses['geral'];
    
    // Personalizar resposta baseada no contexto
    if (context.length > 0) {
      const lastIntent = context[context.length - 1]?.intent;
      
      if (lastIntent === 'planos' && intent === 'interesse_plano') {
        return {
          message: 'Excelente escolha! 🎉\n\nVou conectar você com nossa equipe de vendas para te ajudar a escolher o plano ideal e fazer sua assinatura.',
          suggestedActions: ['Falar com vendas', 'Ver comparação de planos', 'Fazer demo personalizada']
        };
      }
      
      if (lastIntent === 'demo' && intent === 'iniciar_demo') {
        return {
          message: 'Perfeito! 🚀\n\nVou iniciar sua demonstração gratuita agora mesmo. Você terá acesso completo por 5 minutos para explorar todas as funcionalidades.',
          suggestedActions: ['Iniciar demo', 'Ver tutorial', 'Falar com especialista']
        };
      }
    }

    return response;
  }

  private shouldEscalateToHuman(intent: string, confidence: number, context: any[]): boolean {
    // Escalar para humano em casos específicos
    const escalationIntents = ['cancelamento', 'feedback_negativo', 'problema_complexo'];
    
    if (escalationIntents.includes(intent)) {
      return true;
    }
    
    // Escalar se confiança muito baixa
    if (confidence < 0.3) {
      return true;
    }
    
    // Escalar se usuário já tentou várias vezes
    if (context.length > 5) {
      return true;
    }
    
    // Escalar se usuário pediu explicitamente
    const humanKeywords = ['humano', 'pessoa', 'atendente', 'supervisor'];
    const lastMessage = context[context.length - 1]?.message?.toLowerCase() || '';
    if (humanKeywords.some(keyword => lastMessage.includes(keyword))) {
      return true;
    }

    return false;
  }

  // Obter sugestões inteligentes baseadas no contexto
  getSmartSuggestions(userId?: string): string[] {
    const context = userId ? this.contextHistory.get(userId) || [] : [];
    const userPrefs = userId ? this.userPreferences.get(userId) || {} : {};
    
    if (context.length === 0) {
      return ['Ver planos', 'Fazer demo', 'Conhecer funcionalidades', 'Falar com suporte'];
    }
    
    const lastIntent = context[context.length - 1]?.intent;
    
    switch (lastIntent) {
      case 'planos':
        return ['Ver detalhes', 'Fazer demo', 'Falar com vendas', 'Comparar planos'];
      case 'demo':
        return ['Iniciar demo', 'Ver tutorial', 'Falar com especialista', 'Ver preços'];
      case 'suporte':
        return ['Descrever problema', 'Ver FAQ', 'Falar com humano', 'Agendar call'];
      default:
        return ['Ver planos', 'Fazer demo', 'Conhecer funcionalidades', 'Falar com suporte'];
    }
  }

  // Limpar contexto do usuário
  clearUserContext(userId: string) {
    this.contextHistory.delete(userId);
    this.saveContextHistory();
  }

  // Obter estatísticas de uso
  getUsageStats() {
    const totalInteractions = Array.from(this.contextHistory.values())
      .reduce((sum, context) => sum + context.length, 0);
    
    const uniqueUsers = this.contextHistory.size;
    
    const intentStats = Array.from(this.contextHistory.values())
      .flat()
      .reduce((acc, interaction) => {
        acc[interaction.intent] = (acc[interaction.intent] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalInteractions,
      uniqueUsers,
      intentStats,
      averageInteractionsPerUser: uniqueUsers > 0 ? totalInteractions / uniqueUsers : 0
    };
  }
}

export const aiService = new AIService();
export default aiService;