/**
 * Bulk update utilities for importing and updating loans
 * Matches existing loans by borrower and updates them, or creates new ones
 */

import { enrichLoan, generatePaymentSchedule } from './loanHelpers';
import { getUserStorageKey } from './userData';
import useLoanStore from '../store/useLoanStore';

/**
 * Match a loan from import data to an existing loan
 * Matches by borrower email (preferred) or borrower name
 */
const matchExistingLoan = (importLoan, existingLoans) => {
  const importEmail = importLoan.borrowerEmail?.toLowerCase().trim();
  const importName = importLoan.borrower?.toLowerCase().trim();
  
  if (!importEmail && !importName) {
    return null;
  }
  
  // Try to match by email first (most reliable)
  if (importEmail) {
    const match = existingLoans.find(loan => {
      const loanEmail = loan.borrowerEmail?.toLowerCase().trim();
      const loanIdentifier = loan.borrowerIdentifier?.toLowerCase().trim();
      return loanEmail === importEmail || loanIdentifier === importEmail;
    });
    if (match) return match;
  }
  
  // Fallback to name matching
  if (importName) {
    const match = existingLoans.find(loan => {
      const loanName = loan.borrower?.toLowerCase().trim();
      const loanIdentifier = loan.borrowerIdentifier?.toLowerCase().trim();
      return loanName === importName || loanIdentifier === importName;
    });
    if (match) return match;
  }
  
  return null;
};

/**
 * Update an existing loan with new data from import
 * Preserves payment schedule if it exists, otherwise generates new one
 */
const updateLoanWithImportData = (existingLoan, importData) => {
  // Preserve important existing data
  const updatedLoan = {
    ...existingLoan,
    // Update basic loan info
    borrower: importData.borrower || existingLoan.borrower,
    amount: importData.amount || existingLoan.amount,
    interestRate: importData.interestRate || existingLoan.interestRate,
    term: importData.term || existingLoan.term,
    startDate: importData.startDate || existingLoan.startDate,
    endDate: importData.endDate || existingLoan.endDate,
    // Update contact info
    borrowerEmail: importData.borrowerEmail || existingLoan.borrowerEmail,
    borrowerPhone: importData.borrowerPhone || existingLoan.borrowerPhone,
    borrowerContact: importData.borrowerContact || existingLoan.borrowerContact,
    loanOfficer: importData.loanOfficer || existingLoan.loanOfficer,
    // Update borrower identifier
    borrowerIdentifier: importData.borrowerEmail?.toLowerCase().trim() || 
                       importData.borrower?.toLowerCase().trim() || 
                       existingLoan.borrowerIdentifier,
    // Preserve existing payment schedule if it exists and has payments
    // Otherwise generate new one
    paymentSchedule: existingLoan.paymentSchedule && existingLoan.paymentSchedule.length > 0
      ? existingLoan.paymentSchedule
      : generatePaymentSchedule({
          id: existingLoan.id,
          amount: importData.amount || existingLoan.amount,
          interestRate: importData.interestRate || existingLoan.interestRate,
          term: importData.term || existingLoan.term,
          startDate: importData.startDate || existingLoan.startDate
        }),
    // Preserve obligations and notes
    obligations: existingLoan.obligations || [],
    notes: existingLoan.notes || [],
    communications: existingLoan.communications || [],
    // Update status if provided, otherwise keep existing
    status: importData.status || existingLoan.status,
    tags: importData.tags || existingLoan.tags || []
  };
  
  // Re-enrich loan to recalculate status and risk score
  return enrichLoan(updatedLoan);
};

/**
 * Bulk import and update loans from file
 * Matches existing loans by borrower and updates them, creates new ones for new borrowers
 */
export const importAndUpdateLoansFromFile = async (file, userIdentifier) => {
  if (!userIdentifier) {
    throw new Error('User identifier required to import loans');
  }

  // Import the parse functions
  const { parseCSV, parseExcel, readFileAsText } = await import('./fileImport');
  
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  let importedLoans = [];

  // Parse the file
  if (fileExtension === 'csv') {
    const text = await readFileAsText(file);
    importedLoans = parseCSV(text);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    importedLoans = await parseExcel(file);
  } else {
    throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: CSV, XLSX`);
  }

  if (importedLoans.length === 0) {
    throw new Error('No valid loans found in file');
  }

  // Get existing loans from store
  const storageKey = getUserStorageKey(userIdentifier);
  const currentStorage = localStorage.getItem(storageKey);
  
  let existingLoans = [];
  if (currentStorage) {
    try {
      const parsed = JSON.parse(currentStorage);
      existingLoans = parsed.state?.loans || [];
    } catch (error) {
      console.warn('Could not parse existing storage', error);
    }
  }

  // Process each imported loan
  const results = {
    updated: [],
    created: [],
    errors: []
  };

  for (const importLoan of importedLoans) {
    try {
      // Try to match with existing loan
      const existingLoan = matchExistingLoan(importLoan, existingLoans);
      
      if (existingLoan) {
        // Update existing loan
        const updatedLoan = updateLoanWithImportData(existingLoan, {
          ...importLoan,
          id: existingLoan.id, // Keep existing ID
          managedBy: existingLoan.managedBy || userIdentifier, // Preserve manager
          userId: existingLoan.userId || userIdentifier
        });
        
        // Replace in existing loans array
        const index = existingLoans.findIndex(l => l.id === existingLoan.id);
        if (index !== -1) {
          existingLoans[index] = updatedLoan;
          results.updated.push({
            borrower: updatedLoan.borrower,
            email: updatedLoan.borrowerEmail,
            loanId: updatedLoan.id
          });
        }
      } else {
        // Create new loan
        const newLoan = {
          ...importLoan,
          id: importLoan.id || `loan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          managedBy: userIdentifier,
          userId: userIdentifier,
          userEmail: userIdentifier,
          borrowerIdentifier: importLoan.borrowerEmail?.toLowerCase().trim() || 
                             importLoan.borrower?.toLowerCase().trim() || null,
          paymentSchedule: importLoan.paymentSchedule || generatePaymentSchedule({
            id: importLoan.id || `loan-${Date.now()}`,
            amount: importLoan.amount,
            interestRate: importLoan.interestRate,
            term: importLoan.term,
            startDate: importLoan.startDate
          }),
          obligations: importLoan.obligations || [],
          notes: importLoan.notes || [],
          communications: importLoan.communications || [],
          tags: importLoan.tags || [],
          status: importLoan.status || 'on_track',
          riskScore: importLoan.riskScore || 50
        };
        
        const enrichedLoan = enrichLoan(newLoan);
        existingLoans.push(enrichedLoan);
        results.created.push({
          borrower: enrichedLoan.borrower,
          email: enrichedLoan.borrowerEmail,
          loanId: enrichedLoan.id
        });
      }
    } catch (error) {
      results.errors.push({
        borrower: importLoan.borrower || 'Unknown',
        error: error.message
      });
      console.error('Error processing loan:', importLoan, error);
    }
  }

  // Save updated loans to storage
  const updatedState = {
    state: {
      loans: existingLoans,
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
      alerts: [], // Will be regenerated
      currentUserId: userIdentifier
    },
    version: 0
  };

  if (currentStorage) {
    try {
      const parsed = JSON.parse(currentStorage);
      updatedState.state = {
        ...parsed.state,
        loans: existingLoans,
        alerts: [] // Clear alerts, will be regenerated
      };
    } catch (error) {
      // Use new state if parsing fails
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(updatedState));

  // Update the Zustand store properly
  useLoanStore.setState({ loans: existingLoans });
  
  // Regenerate alerts for all loans
  useLoanStore.getState().generateAlerts();

  return {
    updated: results.updated.length,
    created: results.created.length,
    errors: results.errors.length,
    total: existingLoans.length,
    details: {
      updated: results.updated,
      created: results.created,
      errors: results.errors
    }
  };
};


