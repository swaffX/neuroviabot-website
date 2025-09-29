import { useState, useEffect, useContext, createContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('discord_token');
    if (token) {
      authService.setToken(token);
      // User will be set by the App component after API call
    }
    setLoading(false);
  }, []);

  const value = {
    user,
    setUser,
    loading,
    setLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Create a simple hook when provider is not available
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    return { user, setUser, loading, setLoading };
  }
  return context;
};



