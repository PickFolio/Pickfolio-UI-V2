import { useState, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [tokens, setTokens] = useState(() => {
    const storedTokens = localStorage.getItem('authTokens');
    return storedTokens ? JSON.parse(storedTokens) : null;
  });

  const userId = tokens?.accessToken ? JSON.parse(atob(tokens.accessToken.split('.')[1])).sub : null;

  const login = (newTokens) => {
    localStorage.setItem('authTokens', JSON.stringify(newTokens));
    setTokens(newTokens);
  };

  const logout = () => {
    localStorage.removeItem('authTokens');
    setTokens(null);
  };

  // The value that will be available to all consuming components
  const value = {
    tokens,
    userId,
    isLoggedIn: !!tokens,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// This is a custom hook that makes it easy to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};