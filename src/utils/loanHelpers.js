import { isDatePast, isWithinDays, daysUntil } from './dateHelpers';
import { calculateRiskScore, calculateMonthlyPayment } from './calculations';

/**
 * Determine loan status based on payment schedule and obligations
 */
export const determineLoanStatus = (loan) => {
  const { paymentSchedule, obligations, endDate } = loan;
  
  // Check for defaulted status (multiple overdue payments)
  const overduePayments = paymentSchedule.filter(p => p.status === 'overdue').length;
  if (overduePayments >= 3) {
    return 'defaulted';
  }
  
  // Check if loan is paid off
  const allPaid = paymentSchedule.every(p => p.status === 'paid');
  if (allPaid) {
    return 'paid_off';
  }
  
  // Check for overdue status
  const hasOverdue = paymentSchedule.some(p => p.status === 'overdue');
  if (hasOverdue) {
    return 'overdue';
  }
  
  // Check for at-risk status
  const upcomingPayments = paymentSchedule.filter(p => 
    p.status === 'pending' && isWithinDays(p.dueDate, 7)
  );
  const incompleteObligations = obligations.filter(o => 
    !o.completed && isDatePast(o.dueDate)
  );
  
  if (upcomingPayments.length > 0 || incompleteObligations.length > 0) {
    return 'at_risk';
  }
  
  return 'on_track';
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status) => {
  const colors = {
    'on_track': 'green',
    'at_risk': 'yellow',
    'overdue': 'orange',
    'paid_off': 'blue',
    'defaulted': 'red'
  };
  return colors[status] || 'gray';
};

/**
 * Get status badge text
 */
export const getStatusText = (status) => {
  const texts = {
    'on_track': 'On Track',
    'at_risk': 'At Risk',
    'overdue': 'Overdue',
    'paid_off': 'Paid Off',
    'defaulted': 'Defaulted'
  };
  return texts[status] || status;
};

/**
 * Get complete Tailwind classes for status badge background and text
 */
export const getStatusBadgeClasses = (status) => {
  const classes = {
    'on_track': 'bg-green-100 text-green-800',
    'at_risk': 'bg-yellow-100 text-yellow-800',
    'overdue': 'bg-orange-100 text-orange-800',
    'paid_off': 'bg-blue-100 text-blue-800',
    'defaulted': 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get complete Tailwind classes for color-based background
 */
export const getColorBgClasses = (color) => {
  const classes = {
    'blue': 'bg-blue-100',
    'green': 'bg-green-100',
    'yellow': 'bg-yellow-100',
    'orange': 'bg-orange-100',
    'red': 'bg-red-100'
  };
  return classes[color] || 'bg-gray-100';
};

/**
 * Get complete Tailwind classes for color-based text
 */
export const getColorTextClasses = (color) => {
  const classes = {
    'blue': 'text-blue-600',
    'green': 'text-green-600',
    'yellow': 'text-yellow-600',
    'orange': 'text-orange-600',
    'red': 'text-red-600'
  };
  return classes[color] || 'text-gray-600';
};

/**
 * Generate payment schedule for a loan
 */
export const generatePaymentSchedule = (loan) => {
  const { amount, interestRate, term, startDate } = loan;
  const schedule = [];
  const monthlyPayment = calculateMonthlyPayment(amount, interestRate, term);
  
  let remainingPrincipal = amount;
  const monthlyRate = interestRate / 100 / 12;
  
  // Parse start date properly
  const startDateObj = new Date(startDate);
  
  for (let i = 0; i < term; i++) {
    const interestAmount = remainingPrincipal * monthlyRate;
    const principalAmount = monthlyPayment - interestAmount;
    remainingPrincipal -= principalAmount;
    
    // Calculate due date: start date + (i + 1) months
    // Use a more reliable method that handles month/year boundaries correctly
    const dueDate = new Date(startDateObj);
    const monthsToAdd = i + 1;
    const targetYear = dueDate.getFullYear() + Math.floor((dueDate.getMonth() + monthsToAdd) / 12);
    const targetMonth = (dueDate.getMonth() + monthsToAdd) % 12;
    
    // Set the date, handling edge cases where the day doesn't exist in the target month
    dueDate.setFullYear(targetYear, targetMonth, 1);
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const originalDay = startDateObj.getDate();
    dueDate.setDate(Math.min(originalDay, daysInMonth));
    
    schedule.push({
      id: `payment-${loan.id}-${i + 1}`,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: monthlyPayment,
      status: 'pending',
      paidDate: null,
      principalAmount: principalAmount,
      interestAmount: interestAmount,
      notes: ''
    });
  }
  
  return schedule;
};

/**
 * Update loan with calculated fields
 */
export const enrichLoan = (loan) => {
  // Update status
  const status = determineLoanStatus(loan);
  
  // Calculate risk score
  const riskScore = calculateRiskScore({ ...loan, status });
  
  return {
    ...loan,
    status,
    riskScore
  };
};

/**
 * Filter loans based on filter state
 */
export const filterLoans = (loans, filters) => {
  return loans.filter(loan => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(loan.status)) return false;
    }
    
    // Borrower filter
    if (filters.borrowers && filters.borrowers.length > 0) {
      if (!filters.borrowers.includes(loan.borrower)) return false;
    }
    
    // Amount range filter
    if (filters.minAmount !== null && loan.amount < filters.minAmount) return false;
    if (filters.maxAmount !== null && loan.amount > filters.maxAmount) return false;
    
    // Date range filter
    if (filters.startDateFrom && loan.startDate < filters.startDateFrom) return false;
    if (filters.startDateTo && loan.startDate > filters.startDateTo) return false;
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matches = 
        loan.borrower.toLowerCase().includes(query) ||
        loan.id.toLowerCase().includes(query) ||
        (loan.borrowerEmail && loan.borrowerEmail.toLowerCase().includes(query)) ||
        loan.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!matches) return false;
    }
    
    return true;
  });
};

