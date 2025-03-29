import React, { createContext, useState, ReactNode } from 'react';

interface AuthContextType {
  token: string;
  saveToken: (token: string) => void;
  logout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: "",
  saveToken: () => {},
  logout: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string>(localStorage.getItem("token") || "");
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const saveToken = (userToken: string) => {
    localStorage.setItem("token", userToken);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <AuthContext.Provider value={{ token, saveToken, logout, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};
