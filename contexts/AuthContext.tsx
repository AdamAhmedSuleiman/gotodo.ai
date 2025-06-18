// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, NotificationPreferences, AuthContextType } from '../types.js'; 
import * as authService from '../services/authService.js'; 
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
        console.log("[AuthContext] User updated locally and in localStorage cache:", newUser);
        return newUser;
      