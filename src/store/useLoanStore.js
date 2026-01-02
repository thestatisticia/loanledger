import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mockLoans } from '../data/mockData';
import { enrichLoan, filterLoans } from '../utils/loanHelpers';
import { formatCurrency } from '../utils/calculations';
import { formatDate } from '../utils/dateHelpers';
import { getUserIdentifier, getUserStorageKey, filterLoansByUser } from '../utils/userData';
import { getUserStorage, setCurrentUserId } from './userStorage';

/**
 * Zustand store for loan management
 * Handles all loan state, filtering, and operations
 */
const useLoanStore = create(
  persist(
    (set, get) => ({
      // Initial state - start with empty loans array
      // Mock data should only be loaded via resetToMockData action
      loans: [],
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

      // Actions
      
      /**
       * Set current user identifier for data isolation
       */
      currentUserId: null,
      setCurrentUser: (userId) => {
        setCurrentUserId(userId); // Update storage adapter
        set({ currentUserId: userId });
      },

      /**
       * Add a new loan
       * Associates loan with borrower (by email/name) and tracks who manages it
       */
      addLoan: (loan) => {
        const { currentUserId } = get();
        const loanWithTracking = {
          ...loan,
          // Track who manages this loan (the company/user who created it)
          managedBy: currentUserId,
          // Associate with borrower for profile matching
          borrowerIdentifier: loan.borrowerEmail?.toLowerCase().trim() || loan.borrower?.toLowerCase().trim() || null,
          // Keep userId for backward compatibility
          userId: currentUserId,
          userEmail: currentUserId
        };
        const enrichedLoan = enrichLoan(loanWithTracking);
        set((state) => ({
          loans: [...state.loans, enrichedLoan]
        }));
        return enrichedLoan;
      },

      /**
       * Update an existing loan
       */
      updateLoan: (loanId, updates) => {
        set((state) => ({
          loans: state.loans.map(loan =>
            loan.id === loanId ? enrichLoan({ ...loan, ...updates }) : loan
          )
        }));
      },

      /**
       * Delete a loan (only if managed by current user/company)
       */
      deleteLoan: (loanId) => {
        const { currentUserId } = get();
        set((state) => ({
          loans: state.loans.filter(loan => {
            // Only allow deletion if loan is managed by current user
            if (loan.id === loanId) {
              return loan.managedBy !== currentUserId;
            }
            return true;
          }),
          selectedLoanId: state.selectedLoanId === loanId ? null : state.selectedLoanId
        }));
      },

      /**
       * Get a loan by ID (only if it's managed by current user/company)
       */
      getLoan: (loanId) => {
        const { loans, currentUserId } = get();
        const loan = loans.find(loan => loan.id === loanId);
        // Only return loan if it's managed by current user/company
        if (loan && currentUserId) {
          return loan.managedBy === currentUserId ? loan : null;
        }
        return loan;
      },

      /**
       * Get selected loan
       */
      getSelectedLoan: () => {
        const { selectedLoanId, loans } = get();
        return loans.find(loan => loan.id === selectedLoanId);
      },

      /**
       * Set selected loan
       */
      setSelectedLoan: (loanId) => {
        set({ selectedLoanId: loanId });
      },

      /**
       * Update filters
       */
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      /**
       * Reset filters
       */
      resetFilters: () => {
        set({
          filters: {
            status: [],
            borrowers: [],
            minAmount: null,
            maxAmount: null,
            startDateFrom: null,
            startDateTo: null,
            searchQuery: ''
          }
        });
      },

      /**
       * Get all loans managed by the current user/company
       * This returns all loans the company manages, not just borrower-specific
       */
      getLoans: () => {
        const { loans, currentUserId } = get();
        if (!currentUserId) return [];
        // Return all loans managed by this company/user
        return loans.filter(loan => loan.managedBy === currentUserId);
      },

      /**
       * Get loans for a specific borrower (by email or name)
       * Used for borrower profile views
       */
      getLoansByBorrower: (borrowerEmail, borrowerName) => {
        const { loans } = get();
        if (!borrowerEmail && !borrowerName) return [];
        
        const emailMatch = borrowerEmail?.toLowerCase().trim();
        const nameMatch = borrowerName?.toLowerCase().trim();
        
        return loans.filter(loan => {
          const loanEmail = loan.borrowerEmail?.toLowerCase().trim();
          const loanName = loan.borrower?.toLowerCase().trim();
          const loanIdentifier = loan.borrowerIdentifier;
          
          // Match by email (most reliable)
          if (emailMatch && loanEmail === emailMatch) return true;
          if (emailMatch && loanIdentifier === emailMatch) return true;
          
          // Match by name (if no email provided)
          if (nameMatch && loanName === nameMatch) return true;
          if (nameMatch && loanIdentifier === nameMatch) return true;
          
          return false;
        });
      },

      /**
       * Get filtered loans (filtered by managed loans and other filters)
       */
      getFilteredLoans: () => {
        const { loans, filters, currentUserId } = get();
        // First filter by managed loans (all loans this company manages)
        const managedLoans = currentUserId 
          ? loans.filter(loan => loan.managedBy === currentUserId)
          : [];
        // Then apply other filters
        return filterLoans(managedLoans, filters);
      },

      /**
       * Update payment status (only for loans managed by current user)
       */
      updatePaymentStatus: (loanId, paymentId, status, paidDate = null) => {
        const { currentUserId } = get();
        set((state) => ({
          loans: state.loans.map(loan => {
            // Only update if loan is managed by current user
            if (loan.id !== loanId || loan.managedBy !== currentUserId) return loan;
            
            const updatedSchedule = loan.paymentSchedule.map(payment =>
              payment.id === paymentId
                ? { ...payment, status, paidDate }
                : payment
            );
            
            // Enrich loan to recalculate status and risk score
            const enriched = enrichLoan({ ...loan, paymentSchedule: updatedSchedule });
            return enriched;
          })
        }));
      },

      /**
       * Update obligation status
       */
      updateObligationStatus: (loanId, obligationId, completed, completedDate = null) => {
        set((state) => ({
          loans: state.loans.map(loan => {
            if (loan.id !== loanId) return loan;
            
            const updatedObligations = loan.obligations.map(obligation =>
              obligation.id === obligationId
                ? { ...obligation, completed, completedDate }
                : obligation
            );
            
            return enrichLoan({ ...loan, obligations: updatedObligations });
          })
        }));
      },

      /**
       * Add note to loan
       */
      addNote: (loanId, note) => {
        set((state) => ({
          loans: state.loans.map(loan =>
            loan.id === loanId
              ? { ...loan, notes: [...loan.notes, note] }
              : loan
          )
        }));
      },

      /**
       * Add communication to loan
       */
      addCommunication: (loanId, communication) => {
        set((state) => ({
          loans: state.loans.map(loan => {
            if (loan.id !== loanId) return loan;
            const communications = loan.communications || [];
            return {
              ...loan,
              communications: [...communications, {
                ...communication,
                id: communication.id || `comm-${loanId}-${Date.now()}`,
                date: communication.date || new Date().toISOString()
              }]
            };
          })
        }));
      },

      /**
       * Get communications for a loan
       */
      getLoanCommunications: (loanId) => {
        const loan = get().loans.find(l => l.id === loanId);
        return loan?.communications || [];
      },

      /**
       * Send automated email notification
       */
      sendEmailNotification: (loanId, type, data) => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan || !loan.borrowerEmail) return;

        let subject = '';
        let content = '';

        switch (type) {
          case 'payment_reminder':
            subject = `Payment Reminder: ${data.amount ? `$${data.amount.toLocaleString()}` : 'Upcoming Payment'}`;
            content = `Dear ${loan.borrower},\n\nThis is a reminder that your payment of ${data.amount ? formatCurrency(data.amount) : 'the scheduled amount'} is due on ${data.dueDate}.\n\nPlease ensure payment is made on time to avoid any late fees.\n\nThank you.`;
            break;
          case 'payment_overdue':
            subject = `Overdue Payment Notice`;
            content = `Dear ${loan.borrower},\n\nYour payment of ${data.amount ? formatCurrency(data.amount) : 'the scheduled amount'} was due on ${data.dueDate} and is now overdue.\n\nPlease contact us immediately to arrange payment.\n\nThank you.`;
            break;
          case 'obligation_reminder':
            subject = `Obligation Reminder: ${data.title || 'Upcoming Obligation'}`;
            content = `Dear ${loan.borrower},\n\nThis is a reminder that ${data.title || 'an obligation'} is due on ${data.dueDate}.\n\nPlease ensure this is completed on time.\n\nThank you.`;
            break;
          default:
            subject = `Loan Update: ${loan.id}`;
            content = `Dear ${loan.borrower},\n\nThis is an update regarding your loan ${loan.id}.\n\nThank you.`;
        }

        const communication = {
          type: 'email',
          direction: 'outbound',
          subject,
          content,
          recipient: loan.borrowerEmail,
          status: 'sent',
          automated: true,
          author: 'System',
          relatedPaymentId: data.paymentId,
          relatedObligationId: data.obligationId
        };

        get().addCommunication(loanId, communication);
        
        // In a real app, you would call an email service API here
        console.log('Email notification sent:', { loanId, type, to: loan.borrowerEmail, subject });
      },

      /**
       * Calculate portfolio statistics (for managed loans)
       */
      getPortfolioStats: () => {
        const { getFilteredLoans } = get();
        const managedLoans = getFilteredLoans();
        
        const totalLoans = managedLoans.length;
               const totalAmount = managedLoans.reduce((sum, loan) => sum + loan.amount, 0);
               const activeLoans = managedLoans.filter(loan =>
                 !['paid_off', 'defaulted'].includes(loan.status)
               ).length;
               const overdueLoans = managedLoans.filter(loan => loan.status === 'overdue').length;
               const atRiskLoans = managedLoans.filter(loan => loan.status === 'at_risk').length;

               // Weighted average interest rate
               const totalWeightedInterest = managedLoans.reduce((sum, loan) =>
                 sum + (loan.amount * loan.interestRate), 0
               );
               const weightedAvgInterest = totalAmount > 0 ? totalWeightedInterest / totalAmount : 0;

               // Total outstanding (sum of remaining principal)
               const totalOutstanding = managedLoans.reduce((sum, loan) => {
                 const paidPayments = loan.paymentSchedule.filter(p => p.status === 'paid').length;
                 const totalPayments = loan.paymentSchedule.length;
                 const paidRatio = totalPayments > 0 ? paidPayments / totalPayments : 0;
                 return sum + (loan.amount * (1 - paidRatio));
               }, 0);

               // Total paid
               const totalPaid = managedLoans.reduce((sum, loan) => {
                 return sum + loan.paymentSchedule
                   .filter(p => p.status === 'paid')
                   .reduce((pSum, p) => pSum + p.amount, 0);
               }, 0);
        
        return {
          totalLoans,
          totalAmount,
          activeLoans,
          overdueLoans,
          atRiskLoans,
          weightedAvgInterest: parseFloat(weightedAvgInterest.toFixed(2)),
          totalOutstanding: Math.round(totalOutstanding),
          totalPaid: Math.round(totalPaid)
        };
      },

      /**
       * Generate alerts based on loan status (for managed loans)
       */
      generateAlerts: () => {
        const { getFilteredLoans } = get();
        const managedLoans = getFilteredLoans();
        const alerts = [];
        const now = new Date();
        
        managedLoans.forEach(loan => {
          // Payment due alerts
          loan.paymentSchedule.forEach(payment => {
            if (payment.status === 'pending') {
              const dueDate = new Date(payment.dueDate);
              const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
              
              if (daysUntil < 0) {
                alerts.push({
                  id: `alert-${loan.id}-${payment.id}-overdue`,
                  loanId: loan.id,
                  type: 'payment_overdue',
                  severity: 'high',
                  title: `Overdue Payment: ${loan.borrower}`,
                  message: `Payment of ${payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} was due on ${payment.dueDate}`,
                  date: now.toISOString(),
                  read: false,
                  actionUrl: `/loans/${loan.id}`
                });
                // Send automated email for overdue payment
                if (loan.borrowerEmail) {
                  get().sendEmailNotification(loan.id, 'payment_overdue', {
                    amount: payment.amount,
                    dueDate: formatDate(payment.dueDate, 'MMM dd, yyyy'),
                    paymentId: payment.id
                  });
                }
              } else if (daysUntil <= 7) {
                alerts.push({
                  id: `alert-${loan.id}-${payment.id}-due`,
                  loanId: loan.id,
                  type: 'payment_due',
                  severity: daysUntil <= 3 ? 'medium' : 'low',
                  title: `Payment Due Soon: ${loan.borrower}`,
                  message: `Payment of ${payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} due in ${daysUntil} day(s)`,
                  date: now.toISOString(),
                  read: false,
                  actionUrl: `/loans/${loan.id}`
                });
                // Send automated email reminder (only once per payment, when it's 7 days out)
                if (loan.borrowerEmail && daysUntil === 7) {
                  get().sendEmailNotification(loan.id, 'payment_reminder', {
                    amount: payment.amount,
                    dueDate: formatDate(payment.dueDate, 'MMM dd, yyyy'),
                    paymentId: payment.id
                  });
                }
              }
            }
          });
          
          // Obligation due alerts
          loan.obligations.forEach(obligation => {
            if (!obligation.completed) {
              const dueDate = new Date(obligation.dueDate);
              const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
              
              if (daysUntil < 0) {
                alerts.push({
                  id: `alert-${loan.id}-${obligation.id}-overdue`,
                  loanId: loan.id,
                  type: 'obligation_due',
                  severity: 'high',
                  title: `Overdue Obligation: ${loan.borrower}`,
                  message: `${obligation.title} was due on ${obligation.dueDate}`,
                  date: now.toISOString(),
                  read: false,
                  actionUrl: `/loans/${loan.id}`
                });
                // Send automated email for overdue obligation
                if (loan.borrowerEmail) {
                  get().sendEmailNotification(loan.id, 'obligation_reminder', {
                    title: obligation.title,
                    dueDate: formatDate(obligation.dueDate, 'MMM dd, yyyy'),
                    obligationId: obligation.id
                  });
                }
              } else if (daysUntil <= 14) {
                alerts.push({
                  id: `alert-${loan.id}-${obligation.id}-due`,
                  loanId: loan.id,
                  type: 'obligation_due',
                  severity: daysUntil <= 7 ? 'medium' : 'low',
                  title: `Obligation Due Soon: ${loan.borrower}`,
                  message: `${obligation.title} due in ${daysUntil} day(s)`,
                  date: now.toISOString(),
                  read: false,
                  actionUrl: `/loans/${loan.id}`
                });
                // Send automated email reminder (only once per obligation, when it's 14 days out)
                if (loan.borrowerEmail && daysUntil === 14) {
                  get().sendEmailNotification(loan.id, 'obligation_reminder', {
                    title: obligation.title,
                    dueDate: formatDate(obligation.dueDate, 'MMM dd, yyyy'),
                    obligationId: obligation.id
                  });
                }
              }
            }
          });
          
          // Risk warnings
          if (loan.riskScore > 70) {
            alerts.push({
              id: `alert-${loan.id}-risk`,
              loanId: loan.id,
              type: 'risk_warning',
              severity: loan.riskScore > 85 ? 'critical' : 'high',
              title: `High Risk Loan: ${loan.borrower}`,
              message: `Loan has a risk score of ${loan.riskScore}. Review recommended.`,
              date: now.toISOString(),
              read: false,
              actionUrl: `/loans/${loan.id}`
            });
          }
        });
        
        // Update alerts in store and preserve read status
        set((state) => {
          const existingAlertsMap = new Map(state.alerts.map(a => [a.id, a]));
          const updatedAlerts = alerts.map(alert => {
            const existing = existingAlertsMap.get(alert.id);
            return existing ? { ...alert, read: existing.read } : alert;
          });
          return { alerts: updatedAlerts };
        });
        
        return alerts;
      },

      /**
       * Mark alert as read
       */
      markAlertRead: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map(alert =>
            alert.id === alertId ? { ...alert, read: true } : alert
          )
        }));
      },

      /**
       * Mark all alerts as read
       */
      markAllAlertsRead: () => {
        set((state) => ({
          alerts: state.alerts.map(alert => ({ ...alert, read: true }))
        }));
      }
    }),
    {
      name: 'loan-tracker-storage', // Base localStorage key (will be made user-specific via storage adapter)
      storage: createJSONStorage(() => getUserStorage()), // Use custom storage adapter
      partialize: (state) => ({ 
        loans: state.loans,
        filters: state.filters,
        currentUserId: state.currentUserId
      }) // Persist loans, filters, and current user
    }
  )
);

export default useLoanStore;

