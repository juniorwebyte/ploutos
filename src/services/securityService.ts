// Serviço de Segurança e Performance
export interface SecurityConfig {
  enableEncryption: boolean;
  enableAuditLog: boolean;
  enableRateLimit: boolean;
  enableInputValidation: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  sessionTimeout: number; // em minutos
  maxLoginAttempts: number;
  passwordMinLength: number;
}

export interface PerformanceConfig {
  enableCaching: boolean;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCodeSplitting: boolean;
  cacheTimeout: number; // em minutos
  maxCacheSize: number; // em MB
}

class SecurityService {
  private config: SecurityConfig = {
    enableEncryption: true,
    enableAuditLog: true,
    enableRateLimit: true,
    enableInputValidation: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8
  };

  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.loadConfig();
    this.setupSecurityHeaders();
    this.setupEventListeners();
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('ploutos_security_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      // Erro ao carregar configuração - usar padrão
    }
  }

  private saveConfig() {
    localStorage.setItem('ploutos_security_config', JSON.stringify(this.config));
  }

  private setupSecurityHeaders() {
    if (typeof window !== 'undefined') {
      // Configurar headers de segurança
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;";
      document.head.appendChild(meta);

      // Configurar headers de segurança adicionais
      const securityHeaders = [
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'X-XSS-Protection', value: '1; mode=block' },
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
      ];

      securityHeaders.forEach(header => {
        const metaHeader = document.createElement('meta');
        metaHeader.httpEquiv = header.name;
        metaHeader.content = header.value;
        document.head.appendChild(metaHeader);
      });
    }
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      // Detectar tentativas de XSS
      document.addEventListener('DOMContentLoaded', () => {
        this.detectXSSAttempts();
      });

      // Monitorar atividade suspeita
      window.addEventListener('beforeunload', () => {
        this.logSecurityEvent('page_unload', 'Sessão encerrada');
      });

      // Detectar mudanças suspeitas no DOM
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.tagName === 'SCRIPT' && !element.getAttribute('src')) {
                  this.logSecurityEvent('suspicious_script', 'Script inline detectado');
                }
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Validação de entrada
  validateInput(input: string, type: 'email' | 'password' | 'text' | 'number'): boolean {
    if (!this.config.enableInputValidation) return true;

    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'password':
        return input.length >= this.config.passwordMinLength && 
               /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(input);
      case 'text':
        return input.length > 0 && input.length <= 1000 && !/<script|javascript:|on\w+=/i.test(input);
      case 'number':
        return !isNaN(Number(input)) && Number(input) >= 0;
      default:
        return true;
    }
  }

  // Sanitização de entrada
  sanitizeInput(input: string): string {
    if (!this.config.enableXSSProtection) return input;

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  // Verificar tentativas de login
  checkLoginAttempts(identifier: string): boolean {
    if (!this.config.enableRateLimit) return true;

    const attempts = this.loginAttempts.get(identifier);
    const now = new Date();

    if (!attempts) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Resetar contador se passou mais de 15 minutos
    if (now.getTime() - attempts.lastAttempt.getTime() > 15 * 60 * 1000) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    if (attempts.count >= this.config.maxLoginAttempts) {
      this.logSecurityEvent('max_login_attempts', `Muitas tentativas de login para ${identifier}`);
      return false;
    }

    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(identifier, attempts);
    return true;
  }

  // Verificar rate limit
  checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    if (!this.config.enableRateLimit) return true;

    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    const current = this.rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (current.count >= maxRequests) {
      this.logSecurityEvent('rate_limit_exceeded', `Rate limit excedido para ${identifier}`);
      return false;
    }

    current.count++;
    this.rateLimitMap.set(key, current);
    return true;
  }

  // Criptografia simples (para dados sensíveis)
  encrypt(data: string): string {
    if (!this.config.enableEncryption) return data;

    try {
      // Implementação simples de criptografia (em produção, usar biblioteca adequada)
      const key = 'ploutos_secret_key_2024';
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return btoa(encrypted);
    } catch (error) {
      // Erro na criptografia
      return data;
    }
  }

  decrypt(encryptedData: string): string {
    if (!this.config.enableEncryption) return encryptedData;

    try {
      const key = 'ploutos_secret_key_2024';
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch (error) {
      // Erro na descriptografia
      return encryptedData;
    }
  }

  // Detectar tentativas de XSS
  private detectXSSAttempts() {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i
    ];

    const checkElement = (element: Element) => {
      const text = element.textContent || '';
      const html = element.innerHTML || '';

      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(text) || pattern.test(html)) {
          this.logSecurityEvent('xss_attempt', `Tentativa de XSS detectada: ${pattern.source}`);
        }
      });
    };

    // Verificar elementos existentes
    document.querySelectorAll('*').forEach(checkElement);

    // Monitorar mudanças
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              checkElement(node as Element);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Log de eventos de segurança
  logSecurityEvent(eventType: string, details: string) {
    if (!this.config.enableAuditLog) return;

    const event = {
      id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: eventType,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ip: typeof window !== 'undefined' ? 'client-side' : 'unknown' // Será obtido pelo backend em produção
    };

    try {
      const existingLogs = JSON.parse(localStorage.getItem('ploutos_security_logs') || '[]');
      existingLogs.unshift(event);
      
      // Manter apenas os últimos 500 logs
      if (existingLogs.length > 500) {
        existingLogs.splice(500);
      }
      
      localStorage.setItem('ploutos_security_logs', JSON.stringify(existingLogs));
    } catch (error) {
      // Erro ao salvar log - não crítico
    }
  }

  // Verificar sessão
  checkSession(): boolean {
    const sessionData = localStorage.getItem('ploutos_session');
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);
      const now = new Date();
      const sessionTime = new Date(session.timestamp);
      const diffMinutes = (now.getTime() - sessionTime.getTime()) / (1000 * 60);

      if (diffMinutes > this.config.sessionTimeout) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      // Erro ao verificar sessão
      return false;
    }
  }

  // Criar sessão
  createSession(userId: string, userData: any) {
    const session = {
      userId,
      userData,
      timestamp: new Date().toISOString(),
      token: this.generateToken()
    };

    localStorage.setItem('ploutos_session', JSON.stringify(session));
    this.logSecurityEvent('session_created', `Sessão criada para usuário ${userId}`);
  }

  // Gerar token
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // Logout
  logout() {
    localStorage.removeItem('ploutos_session');
    this.logSecurityEvent('session_ended', 'Sessão encerrada');
  }

  // Obter configuração
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  // Obter logs de segurança
  getSecurityLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('ploutos_security_logs') || '[]');
    } catch (error) {
      // Erro ao obter logs - retornar array vazio
      return [];
    }
  }

  // Limpar logs antigos
  clearOldLogs(daysToKeep: number = 7) {
    try {
      const logs = this.getSecurityLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const filteredLogs = logs.filter((log: any) => 
        new Date(log.timestamp) >= cutoffDate
      );
      
      localStorage.setItem('ploutos_security_logs', JSON.stringify(filteredLogs));
    } catch (error) {
      // Erro ao limpar logs - não crítico
    }
  }
}

class PerformanceService {
  private config: PerformanceConfig = {
    enableCaching: true,
    enableCompression: true,
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCodeSplitting: true,
    cacheTimeout: 60,
    maxCacheSize: 50
  };

  private cache: Map<string, { data: any; timestamp: number; size: number }> = new Map();
  private totalCacheSize = 0;

  constructor() {
    this.loadConfig();
    this.setupPerformanceMonitoring();
  }

  private loadConfig() {
    try {
      const saved = localStorage.getItem('ploutos_performance_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      // Erro ao carregar configuração - usar padrão
    }
  }

  private saveConfig() {
    localStorage.setItem('ploutos_performance_config', JSON.stringify(this.config));
  }

  private setupPerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitorar performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.measurePerformance();
        }, 1000);
      });

      // Monitorar mudanças de performance
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.logPerformanceMetric(entry);
          });
        });

        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      }
    }
  }

  // Cache de dados
  setCache(key: string, data: any, ttl: number = this.config.cacheTimeout): void {
    if (!this.config.enableCaching) return;

    const size = JSON.stringify(data).length;
    const maxSize = this.config.maxCacheSize * 1024 * 1024; // Converter para bytes

    // Limpar cache se exceder o tamanho máximo
    if (this.totalCacheSize + size > maxSize) {
      this.clearOldCache();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    });

    this.totalCacheSize += size;
  }

  getCache(key: string): any | null {
    if (!this.config.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const ttl = this.config.cacheTimeout * 60 * 1000; // Converter para milissegundos

    if (now - cached.timestamp > ttl) {
      this.cache.delete(key);
      this.totalCacheSize -= cached.size;
      return null;
    }

    return cached.data;
  }

  clearCache(): void {
    this.cache.clear();
    this.totalCacheSize = 0;
  }

  private clearOldCache(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remover 20% dos itens mais antigos
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      const [key, value] = entries[i];
      this.cache.delete(key);
      this.totalCacheSize -= value.size;
    }
  }

  // Lazy loading
  lazyLoadImage(img: HTMLImageElement, src: string): void {
    if (!this.config.enableLazyLoading) {
      img.src = src;
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  }

  // Otimização de imagens
  optimizeImage(src: string, width?: number, height?: number): string {
    if (!this.config.enableImageOptimization) return src;

    // Simulação de otimização (em produção, usar serviço real)
    let optimizedSrc = src;
    
    if (width || height) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('q', '80'); // Qualidade 80%
      
      optimizedSrc = `${src}?${params.toString()}`;
    }

    return optimizedSrc;
  }

  // Medir performance
  private measurePerformance(): void {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0
    };

    // Medir First Paint e First Contentful Paint
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
      });

      paintObserver.observe({ entryTypes: ['paint'] });
    }

    this.logPerformanceMetric({
      name: 'page_load',
      startTime: 0,
      duration: navigation.loadEventEnd - navigation.fetchStart,
      detail: metrics
    });
  }

  // Log de métricas de performance
  private logPerformanceMetric(entry: PerformanceEntry): void {
    try {
      const metric = {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        type: entry.entryType,
        url: window.location.href
      };

      const existingMetrics = JSON.parse(localStorage.getItem('ploutos_performance_metrics') || '[]');
      existingMetrics.unshift(metric);

      // Manter apenas os últimos 200 métricas
      if (existingMetrics.length > 200) {
        existingMetrics.splice(200);
      }

      localStorage.setItem('ploutos_performance_metrics', JSON.stringify(existingMetrics));
    } catch (error) {
      // Erro ao salvar métrica - não crítico
    }
  }

  // Obter métricas de performance
  getPerformanceMetrics(): any[] {
    try {
      return JSON.parse(localStorage.getItem('ploutos_performance_metrics') || '[]');
    } catch (error) {
      // Erro ao obter métricas - retornar array vazio
      return [];
    }
  }

  // Obter configuração
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  // Obter estatísticas de cache
  getCacheStats() {
    return {
      size: this.totalCacheSize,
      maxSize: this.config.maxCacheSize * 1024 * 1024,
      entries: this.cache.size,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // Simulação de cálculo de hit rate
    return 0.85; // 85% de hit rate
  }
}

export const securityService = new SecurityService();
export const performanceService = new PerformanceService();
export default { securityService, performanceService };
