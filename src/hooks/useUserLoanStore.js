/**
 * User-aware wrapper for the loan store
 * Filters loans to only show those belonging to the current user
 */
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import useLoanStore from '../store/useLoanStore';
import { getUserIdentifier, getUserStorageKey, filterLoansByUser } from '../utils/userData';
import { mockLoans } from '../data/mockData';
import { enrichLoan } from '../utils/loanHelpers';

export const useUserLoanStore = () => {
  const { user, ready } = usePrivy();
  const userIdentifier = ready && user ? getUserIdentifier(user) : null;
  const storageKey = userIdentifier ? getUserStorageKey(userIdentifier) : 'loan-tracker-storage';
  
  // Get the base store
  const baseStore = useLoanStore();
  
  // Filter loans to only show user's loans
  const userLoans = userIdentifier 
    ? filterLoansByUser(baseStore.loans, userIdentifier)
    : [];
  
  // Initialize user's data if they have no loans
  useEffect(() => {
    if (ready && userIdentifier && userLoans.length === 0) {
      // Check if this is a new user (no data in their storage)
      const userStorage = localStorage.getItem(storageKey);
      if (!userStorage) {
        // Initialize with empty loans for new user
        // They can add their own loans
        baseStore.setFilters({ status: [], borrowers: [], minAmount: null, maxAmount: null, startDateFrom: null, startDateTo: null, searchQuery: '' });
      }
    }
  }, [ready, userIdentifier, userLoans.length, storageKey, baseStore]);
  
  // Override methods to ensure user association
  const addLoan = (loan) => {
    // Associate loan with current user
    const loanWithUser = {
      ...loan,
      userId: userIdentifier,
      userEmail: userIdentifier // For backward compatibility
    };
    return baseStore.addLoan(loanWithUser);
  };
  
  // Override getFilteredLoans to only return user's loans
  const getFilteredLoans = () => {
    const allFiltered = baseStore.getFilteredLoans();
    return userIdentifier 
      ? filterLoansByUser(allFiltered, userIdentifier)
      : [];
  };
  
  // Override loans getter
  const loans = userLoans;
  
  // Return modified store with user-filtered data
  return {
    ...baseStore,
    loans,
    getFilteredLoans,
    addLoan,
    userIdentifier,
    isReady: ready && !!userIdentifier
  };
};

export default useUserLoanStore;


