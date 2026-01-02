/**
 * Data management utilities for testing and development
 * Provides functions to manage loan data in localStorage
 * All operations are user-specific
 */

import { mockLoans } from '../data/mockData';
import { enrichLoan } from './loanHelpers';
import { getUserStorageKey } from './userData';
import useLoanStore from '../store/useLoanStore';

/**
 * Reset to mock data - clears all existing data and loads fresh mock data
 * Associates mock loans with the current user
 */
export const resetToMockData = (userIdentifier) => {
  if (!userIdentifier) {
    console.error('User identifier required to reset mock data');
    return false;
  }
  
  // Associate mock loans with current user
  const enrichedLoans = mockLoans.map(loan => {
    const enriched = enrichLoan(loan);
    return {
      ...enriched,
      userId: userIdentifier,
      userEmail: userIdentifier // For backward compatibility
    };
  });
  
  // Use user-specific storage key
  const storageKey = getUserStorageKey(userIdentifier);
  const currentStorage = localStorage.getItem(storageKey);
  
  if (currentStorage) {
    try {
      const parsed = JSON.parse(currentStorage);
      // Update only the loans, keep other state if needed
      const updated = {
        ...parsed,
        state: {
          ...parsed.state,
          loans: enrichedLoans,
          alerts: [], // Clear alerts, they'll be regenerated
          currentUserId: userIdentifier
        }
      };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error resetting data:', error);
      return false;
    }
  } else {
    // If no existing storage, create new
    const newState = {
      state: {
        loans: enrichedLoans,
        filters: {
          status: [],
          borrowers: [],
          minAmount: null,
          maxAmount: null,
          startDateFrom: null,
          startDateTo: null,
          searchQuery: ''
        },
        selectedLoanId: null,
        alerts: [],
        currentUserId: userIdentifier
      },
      version: 0
    };
    localStorage.setItem(storageKey, JSON.stringify(newState));
    return true;
  }
};

/**
 * Export all loan data as JSON (for current user)
 */
export const exportLoanData = (userIdentifier) => {
  if (!userIdentifier) {
    console.error('User identifier required to export data');
    return null;
  }
  
  const storageKey = getUserStorageKey(userIdentifier);
  const data = localStorage.getItem(storageKey);
  
  if (!data) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(data);
    const loans = parsed.state?.loans || [];
    
    // Create export object
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      loanCount: loans.length,
      loans: loans
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loan-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return exportData;
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

/**
 * Import loan data from JSON file (associates with current user)
 */
export const importLoanData = (file, userIdentifier) => {
  if (!userIdentifier) {
    return Promise.reject(new Error('User identifier required to import data'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const loans = imported.loans || imported; // Support both formats
        
        if (!Array.isArray(loans)) {
          reject(new Error('Invalid data format: loans must be an array'));
          return;
        }
        
        // Validate loan structure
        const validLoans = loans.filter(loan => 
          loan.id && loan.borrower && loan.amount
        );
        
        if (validLoans.length === 0) {
          reject(new Error('No valid loans found in import file'));
          return;
        }
        
        // Enrich and associate loans with current user
        const enrichedLoans = validLoans.map(loan => {
          const enriched = enrichLoan(loan);
          return {
            ...enriched,
            userId: userIdentifier,
            userEmail: userIdentifier // For backward compatibility
          };
        });
        
        const storageKey = getUserStorageKey(userIdentifier);
        const currentStorage = localStorage.getItem(storageKey);
        
        let updated;
        if (currentStorage) {
          const parsed = JSON.parse(currentStorage);
          updated = {
            ...parsed,
            state: {
              ...parsed.state,
              loans: enrichedLoans,
              alerts: []
            }
          };
        } else {
          updated = {
            state: {
              loans: enrichedLoans,
              filters: {
                status: [],
                borrowers: [],
                minAmount: null,
                maxAmount: null,
                startDateFrom: null,
                startDateTo: null,
                searchQuery: ''
              },
              selectedLoanId: null,
              alerts: [],
              currentUserId: userIdentifier
            },
            version: 0
          };
        }
        
        localStorage.setItem(storageKey, JSON.stringify(updated));
        resolve({
          imported: validLoans.length,
          total: enrichedLoans.length
        });
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Clear all loan data (for current user)
 */
export const clearAllData = (userIdentifier) => {
  if (!userIdentifier) {
    console.error('User identifier required to clear data');
    return false;
  }
  
  const storageKey = getUserStorageKey(userIdentifier);
  localStorage.removeItem(storageKey);
  return true;
};

/**
 * Get data statistics (for current user)
 */
export const getDataStats = (userIdentifier) => {
  if (!userIdentifier) {
    return {
      hasData: false,
      loanCount: 0,
      totalAmount: 0,
      lastUpdated: null
    };
  }
  
  const storageKey = getUserStorageKey(userIdentifier);
  const data = localStorage.getItem(storageKey);
  
  if (!data) {
    return {
      hasData: false,
      loanCount: 0,
      totalAmount: 0,
      lastUpdated: null
    };
  }
  
  try {
    const parsed = JSON.parse(data);
    const loans = parsed.state?.loans || [];
    
    const totalAmount = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    
    return {
      hasData: loans.length > 0,
      loanCount: loans.length,
      totalAmount,
      lastUpdated: parsed.state ? 'Recently' : null
    };
  } catch (error) {
    return {
      hasData: false,
      loanCount: 0,
      totalAmount: 0,
      lastUpdated: null,
      error: error.message
    };
  }
};

