/**
 * Custom storage adapter for Zustand that uses user-specific keys
 */
import { getUserStorageKey } from '../utils/userData';

let currentUserId = null;

export const setCurrentUserId = (userId) => {
  currentUserId = userId;
};

export const getUserStorage = () => {
  const storageKey = currentUserId 
    ? getUserStorageKey(currentUserId)
    : 'loan-tracker-storage';
  
  return {
    getItem: (name) => {
      // Override the name with user-specific key
      const key = name === 'loan-tracker-storage' ? storageKey : name;
      return localStorage.getItem(key);
    },
    setItem: (name, value) => {
      // Override the name with user-specific key
      const key = name === 'loan-tracker-storage' ? storageKey : name;
      localStorage.setItem(key, value);
    },
    removeItem: (name) => {
      // Override the name with user-specific key
      const key = name === 'loan-tracker-storage' ? storageKey : name;
      localStorage.removeItem(key);
    }
  };
};


