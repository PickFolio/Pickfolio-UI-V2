import { useState, createContext, useContext } from 'react';

const AuthContext = createContext(null);

const parseStoredTokens = () => {
  try {
    const storedTokens = localStorage.getItem('authTokens');
    return storedTokens ? JSON.parse(storedTokens) : null;
  } catch {
    localStorage.removeItem('authTokens');
    return null;
  }
};

const decodeUserId = (accessToken) => {
  try {
    if (!accessToken) return null;
    return JSON.parse(atob(accessToken.split('.')[1])).sub;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [tokens, setTokens] = useState(parseStoredTokens);

  const userId = decodeUserId(tokens?.accessToken);

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
    isLoggedIn: !!tokens?.accessToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// This is a custom hook that makes it easy to use the auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
