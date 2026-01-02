/**
 * User-specific data utilities
 * Handles user identification and data isolation
 */

/**
 * Get user identifier from Privy user object
 */
export const getUserIdentifier = (user) => {
  if (!user) return null;
  
  // Use email as primary identifier
  if (user?.email?.address) {
    return user.email.address;
  }
  
  // Fallback to Privy user ID
  if (user?.id) {
    return user.id;
  }
  
  return null;
};

/**
 * Get user-specific storage key
 */
export const getUserStorageKey = (userIdentifier) => {
  if (!userIdentifier) return 'loan-tracker-storage';
  
  // Create a safe key from email (replace @ and . with _)
  const safeKey = userIdentifier.replace(/[@.]/g, '_');
  return `loan-tracker-storage-${safeKey}`;
};

/**
 * Check if loan belongs to user
 */
export const isUserLoan = (loan, userIdentifier) => {
  if (!userIdentifier) return false;
  
  // Check managedBy first (primary tracking field)
  if (loan.managedBy) {
    return loan.managedBy === userIdentifier;
  }
  
  // Check if loan has userId field
  if (loan.userId) {
    return loan.userId === userIdentifier;
  }
  
  // Check if loan has userEmail field (for backward compatibility)
  if (loan.userEmail) {
    return loan.userEmail === userIdentifier;
  }
  
  // If no user association, return false (don't show orphaned loans)
  return false;
};

/**
 * Filter loans by user
 */
export const filterLoansByUser = (loans, userIdentifier) => {
  if (!userIdentifier) return [];
  return loans.filter(loan => isUserLoan(loan, userIdentifier));
};


