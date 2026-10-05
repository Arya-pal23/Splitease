import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('splitease_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const currentUser = await fetchApi('/auth/me');
      setUser(currentUser);
    } catch (err) {
      console.error('Auth check failed', err);
      localStorage.removeItem('splitease_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (name, password) => {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, password })
    });
    localStorage.setItem('splitease_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, username, password) => {
    const data = await fetchApi('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, username, password })
    });
    localStorage.setItem('splitease_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const switchDemoUser = async (userId) => {
    setLoading(true);
    try {
      const data = await fetchApi('/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
      localStorage.setItem('splitease_token', data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('splitease_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, switchDemoUser, refreshUser: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
