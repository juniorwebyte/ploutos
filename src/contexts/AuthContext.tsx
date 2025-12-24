import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import licenseService, { LicenseRecord } from '../services/licenseService';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: string | null;
  license?: License | null;
  setLicense?: (lic: License | null) => void;
  role: 'user' | 'admin' | 'superadmin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | 'superadmin'>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return (localStorage.getItem('caixa_role') as any) || 'user';
      }
    } catch (e) {
      console.error('Erro ao acessar localStorage:', e);
    }
    return 'user';
  });

  useEffect(() => {
    try {
      // Verificar se localStorage está disponível
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      // Verificar se há uma sessão ativa no localStorage
      const savedUser = localStorage.getItem('caixa_user');
      const lastLogin = localStorage.getItem('caixa_last_login');
    
    if (savedUser && lastLogin) {
      const lastLoginTime = new Date(lastLogin).getTime();
      const currentTime = new Date().getTime();
      const hoursSinceLogin = (currentTime - lastLoginTime) / (1000 * 60 * 60);
      
      // Logout automático após 8 horas
      if (hoursSinceLogin < 8) {
        setIsAuthenticated(true);
        setUser(savedUser);
        const savedRole = (localStorage.getItem('caixa_role') as any) || 'user';
        setRole(savedRole);
        // Carregar status de licença do localStorage
        try {
          const savedLicense = localStorage.getItem('ploutos_license');
          if (savedLicense) {
            const licenseData = JSON.parse(savedLicense);
            // Converter para o formato esperado
            setLicense({
              ...licenseData,
              createdAt: licenseData.createdAt ? new Date(licenseData.createdAt) : new Date(),
              expiresAt: licenseData.expiresAt ? new Date(licenseData.expiresAt) : new Date(),
              lastUsed: licenseData.lastUsed ? new Date(licenseData.lastUsed) : new Date()
            } as any);
          } else {
            // Tentar buscar do licenseService
            try {
              const allLicenses = licenseService.getAllLicenses();
              const userLicense = allLicenses.find(l => 
                l.username === savedUser || 
                l.userId === savedUser
              );
              if (userLicense) {
                setLicense(userLicense as any);
              } else {
                setLicense(null);
              }
            } catch (licenseError) {
              console.error('Erro ao buscar licenças:', licenseError);
              setLicense(null);
            }
          }
        } catch (e) {
          console.error('Erro ao carregar licença:', e);
          setLicense(null);
        }
      } else {
        localStorage.removeItem('caixa_user');
        localStorage.removeItem('caixa_last_login');
      }
    }
    } catch (error) {
      console.error('Erro ao carregar sessão do localStorage:', error);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Credenciais válidas para teste offline
      const validCredentials = {
        'Webyte': { password: 'Webyte', role: 'user' },
        'admin': { password: 'admin123', role: 'superadmin' },
        'demo': { password: 'demo123', role: 'user' },
        'caderno': { password: 'caderno2025', role: 'user' }
      };

      // Verificar se é um usuário criado offline
      const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      const offlineUser = storedUsers.find((u: any) => u.username === username);
      
      // Se for usuário offline, verificar senha salva ou usar padrão
      if (offlineUser) {
        const savedPassword = offlineUser.password || 'demo123'; // Usar senha salva ou padrão
        if (password === savedPassword) {
          const token = btoa(JSON.stringify({ username, role: offlineUser.role || 'user', timestamp: Date.now() }));
          
          localStorage.setItem('auth_token', token);
          localStorage.setItem('caixa_user', username);
          localStorage.setItem('caixa_last_login', new Date().toISOString());
          localStorage.setItem('caixa_role', offlineUser.role || 'user');
          
          setIsAuthenticated(true);
          setUser(username);
          setRole((offlineUser.role || 'user') as any);
          
          // Carregar licença do localStorage
          const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
          const userLicense = licenses.find((l: any) => l.username === username || l.userId === offlineUser.id);
          if (userLicense) {
            setLicense({
              id: userLicense.id,
              userId: userLicense.userId,
              username: userLicense.username,
              email: '',
              key: '',
              status: userLicense.status === 'trial' ? 'active' : userLicense.status,
              planId: '',
              planName: 'Trial',
              createdAt: new Date(userLicense.createdAt),
              expiresAt: new Date(userLicense.validUntil),
              lastUsed: new Date(),
              usageCount: 0,
              maxUsage: 0,
              features: [],
              metadata: {}
            });
          }
          
          return true;
        }
      }

      const userCreds = validCredentials[username as keyof typeof validCredentials];
      
      if (userCreds && userCreds.password === password) {
        // Simular token JWT
        const token = btoa(JSON.stringify({ username, role: userCreds.role, timestamp: Date.now() }));
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('caixa_user', username);
        localStorage.setItem('caixa_last_login', new Date().toISOString());
        localStorage.setItem('caixa_role', userCreds.role);
        
        setIsAuthenticated(true);
        setUser(username);
        setRole(userCreds.role);
        
        // NÃO criar licença automática - apenas se houver pagamento real
        // Verificar se existe licença salva no localStorage
        const savedLicense = localStorage.getItem('ploutos_license');
        if (savedLicense) {
          try {
            const licenseData = JSON.parse(savedLicense);
            setLicense(licenseData);
          } catch (e) {
            setLicense(null);
          }
        } else {
          // SEM licença = SEM acesso ao cashflow
          setLicense(null);
        }
        
        console.log(`Login offline successful for user: ${username}`);
        return true;
      } else {
        console.log(`Invalid credentials for user: ${username}`);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setRole('user');
    localStorage.removeItem('caixa_user');
    localStorage.removeItem('caixa_last_login');
    localStorage.removeItem('caixa_role');
    localStorage.removeItem('auth_token');
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    user,
    license,
    setLicense,
    role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
