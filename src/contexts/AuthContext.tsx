import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types/auth';
import { loginUser, registerUser, verifyToken, logoutUser as apiLogout } from '../api/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Verify token and get current user on mount
    const initializeAuth = async () => {
      try {
        const user = await verifyToken();
        if (user) {
          setAuthState({
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role as 'admin' | 'member' | 'guest',
              joinDate: user.createdAt,
              lastActive: user.lastLogin || user.createdAt,
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await loginUser({ username, password });
      
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role as 'admin' | 'member' | 'guest',
        joinDate: response.user.createdAt,
        lastActive: response.user.lastLogin || response.user.createdAt,
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await registerUser({ username, email, password, role: 'member' });
      
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role as 'admin' | 'member' | 'guest',
        joinDate: response.user.createdAt,
        lastActive: response.user.lastLogin || response.user.createdAt,
      };

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
