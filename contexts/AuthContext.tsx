
// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, NotificationPreferences, AuthContextType } from '../src/types.js'; 
import { mockLogin, mockLogout, mockRegister } from '../services/authService.js'; 
import { useToast } from './ToastContext.js'; 

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'gotodoUser';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast(); 

  useEffect(() => {
    console.log("[AuthContext] Initializing: Checking for stored user...");
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
            setUser(parsedUser);
            console.log("[AuthContext] User loaded from localStorage:", parsedUser);
        } else {
            console.warn("[AuthContext] Invalid user data in localStorage. Clearing.");
            localStorage.removeItem(USER_STORAGE_KEY);
        }
      } catch (e) {
        console.error("[AuthContext] Error parsing user from localStorage. Clearing.", e);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } else {
        console.log("[AuthContext] No user found in localStorage.");
    }
    setIsLoading(false);
  }, []);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser(currentUser => {
      if (currentUser) {
        const newUser = { ...currentUser, ...updatedFields };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        console.log("[AuthContext] User updated and saved:", newUser);
        return newUser;
      }
      return null; 
    });
  }, []);

  const login = async (email: string, password_DUMMY: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await mockLogin(email, password_DUMMY);
      setUser(loggedInUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      console.log("[AuthContext] Login successful, user saved:", loggedInUser);
    } catch (error) {
      console.error("[AuthContext] Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password_DUMMY: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const registeredUser = await mockRegister(name, email, password_DUMMY, role);
      setUser(registeredUser); 
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(registeredUser));
      console.log("[AuthContext] Registration successful, user saved:", registeredUser);
    } catch (error) {
      console.error("[AuthContext] Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    setIsLoading(true);
    await mockLogout();
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    console.log("[AuthContext] Logout successful, user removed from localStorage.");
    addToast("You have been logged out.", "info"); 
    setIsLoading(false);
  };

  const setUserRole = (role: UserRole) => { 
    if (user) {
      updateUser({ role }); 
      console.log(`[AuthContext] User role changed to ${role} and saved.`);
      addToast(`Switched to ${role} role.`, "success");
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading, updateUser, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};