/**
 * Component to initialize the store with current user context
 * This ensures data isolation per user
 */
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import useLoanStore from '../../store/useLoanStore';
import { getUserIdentifier, getUserStorageKey } from '../../utils/userData';
import { filterLoansByUser } from '../../utils/userData';

const UserStoreInitializer = ({ children }) => {
  const { user, ready, authenticated } = usePrivy();
  const { setCurrentUser } = useLoanStore();
  
  useEffect(() => {
    if (ready && authenticated && user) {
      const userIdentifier = getUserIdentifier(user);
      if (userIdentifier) {
        // Set current user in store (this triggers user-specific storage)
        setCurrentUser(userIdentifier);
        
        // Check if this is a new user with no loans
        const userStorageKey = getUserStorageKey(userIdentifier);
        const userStorage = localStorage.getItem(userStorageKey);
        
        // If new user with no data, they'll start with empty loans
        // They can add their own loans or use the Data Management page to load sample data
      }
    } else if (ready && !authenticated) {
      // Clear user when logged out
      setCurrentUser(null);
    }
  }, [ready, authenticated, user, setCurrentUser]);
  
  return children;
};

export default UserStoreInitializer;

