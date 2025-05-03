import React, { createContext, useState } from 'react';

export const AuthContext = createContext({
  token: "",
  saveToken: () => {},
  logout: () => {},
  darkMode: false,
  toggleDarkMode: () => {},
});

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [darkMode, setDarkMode] = useState(false);

  const saveToken = (userToken) => {
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
}
