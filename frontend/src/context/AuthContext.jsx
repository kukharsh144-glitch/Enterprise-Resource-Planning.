import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { API_BASE_URL, SOCKET_URL } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [socket, setSocket] = useState(null);

  // Initialize Auth state from localStorage and sync live DB record
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // ignore parsing error
        }
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Could not sync live user profile from DB:', err?.message);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Sync theme attribute on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Connect to Socket.io when user is logged in
  useEffect(() => {
    if (user) {
      const socketUrl = SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '');
      const newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Real-time updates socket connected:', newSocket.id);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  // Handle external logout triggers (e.g. from axios interceptor)
  useEffect(() => {
    const handleExternalLogout = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth-logout', handleExternalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleExternalLogout);
    };
  }, []);

  const login = async (username, password) => {
    try {
      // The backend accepts username OR email. We try username, and if it's an email, we pass it as email.
      const payload = username.includes('@') ? { email: username, password } : { username, password };
      
      const response = await api.post('/auth/login', payload);
      const { user: userData, accessToken } = response.data?.data || {};

      if (userData && accessToken) {
        localStorage.setItem('accessToken', accessToken);
        try {
          const meRes = await api.get('/auth/me');
          const fullUser = meRes.data?.data || userData;
          setUser(fullUser);
          localStorage.setItem('user', JSON.stringify(fullUser));
        } catch {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        return { success: true };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
  };

  const updateProfile = async (payload) => {
    try {
      const res = await api.put('/auth/profile', payload);
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        return { success: true, data: res.data.data };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      return { success: false, message };
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.data) {
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Profile refresh failed:', err?.message);
    }
    return null;
  };

  const register = async (fullname, username, email, password, role) => {
    try {
      const response = await api.post('/auth/register', {
        fullname,
        username,
        email,
        password,
        role
      });
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  const value = {
    user,
    setUser,
    loading,
    theme,
    toggleTheme,
    login,
    logout,
    register,
    hasRole,
    socket,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
