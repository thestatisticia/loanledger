import { differenceInMonths, parseISO } from 'date-fns';
import { daysUntil, isDatePast } from './dateHelpers';

/**
 * Calculate monthly payment amount using standard amortization formula
 * @param {number} principal - Loan principal amount
 * @param {number} annualRate - Annual interest rate (as percentage, e.g., 5 for 5%)
 * @param {number} termMonths - Loan term in months
 * @returns {number} Monthly payment amount
 */
export const calculateMonthlyPayment = (principal, annualRate, termMonths) => {
  if (termMonths === 0 || annualRate === 0) {
    return principal / termMonths || 0;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths);
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1;
  
  return numerator / denominator;
};

/**
 * Calculate total interest over loan term
 */
export const calculateTotalInterest = (principal, annualRate, termMonths) => {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  return monthlyPayment * termMonths - principal;
};

/**
 * Calculate remaining principal after N payments
 */
export const calculateRemainingPrincipal = (principal, annualRate, termMonths, paymentsMade) => {
  if (paymentsMade >= termMonths) return 0;
  
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  
  const remainingPayments = termMonths - paymentsMade;
  const remainingPrincipal = principal * Math.pow(1 + monthlyRate, paymentsMade) - 
    monthlyPayment * (Math.pow(1 + monthlyRate, paymentsMade) - 1) / monthlyRate;
  
  return Math.max(0, remainingPrincipal);
};

/**
 * Calculate payment breakdown (principal and interest portions)
 */
export const calculatePaymentBreakdown = (principal, annualRate, termMonths, paymentNumber) => {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  
  const remainingPrincipal = calculateRemainingPrincipal(principal, annualRate, termMonths, paymentNumber - 1);
  const interestAmount = remainingPrincipal * monthlyRate;
  const principalAmount = monthlyPayment - interestAmount;
  
  return {
    total: monthlyPayment,
    principal: principalAmount,
    interest: interestAmount
  };
};

/**
 * Calculate loan progress percentage
 */
export const calculateLoanProgress = (loan) => {
  const { startDate, endDate, paymentSchedule } = loan;
  
  // Time-based progress
  const totalMonths = differenceInMonths(parseISO(endDate), parseISO(startDate));
  const elapsedMonths = differenceInMonths(new Date(), parseISO(startDate));
  const timeProgress = Math.min(100, Math.max(0, (elapsedMonths / totalMonths) * 100));
  
  // Payment-based progress
  const totalPayments = paymentSchedule.length;
  const paidPayments = paymentSchedule.filter(p => p.status === 'paid').length;
  const paymentProgress = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  
  // Amount-based progress
  const totalAmount = paymentSchedule.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = paymentSchedule
    .filter(p => p.status === 'paid' || p.status === 'partial')
    .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);
  const amountProgress = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  
  // Weighted average (time 30%, payments 40%, amount 30%)
  return {
    overall: (timeProgress * 0.3 + paymentProgress * 0.4 + amountProgress * 0.3),
    time: timeProgress,
    payments: paymentProgress,
    amount: amountProgress
  };
};

/**
 * Calculate risk score for a loan
 */
export const calculateRiskScore = (loan) => {
  let riskScore = 50; // Base risk score
  
  // Payment history (0-30 points)
  const overduePayments = loan.paymentSchedule.filter(p => p.status === 'overdue').length;
  const totalPayments = loan.paymentSchedule.length;
  if (totalPayments > 0) {
    const overdueRatio = overduePayments / totalPayments;
    riskScore += overdueRatio * 30; // Up to +30 for overdue payments
  }
  
  // Obligation compliance (0-20 points)
  const incompleteObligations = loan.obligations.filter(o => !o.completed && isDatePast(o.dueDate)).length;
  const totalObligations = loan.obligations.length;
  if (totalObligations > 0) {
    const nonComplianceRatio = incompleteObligations / totalObligations;
    riskScore += nonComplianceRatio * 20; // Up to +20 for incomplete obligations
  }
  
  // Time to maturity (0-20 points)
  const daysUntilMaturity = daysUntil(loan.endDate);
  if (daysUntilMaturity !== null && daysUntilMaturity < 90) {
    riskScore += (90 - daysUntilMaturity) / 90 * 20; // Higher risk as maturity approaches
  }
  
  // Loan status (0-30 points)
  const statusRisk = {
    'on_track': 0,
    'at_risk': 15,
    'overdue': 25,
    'defaulted': 30,
    'paid_off': -20
  };
  riskScore += statusRisk[loan.status] || 0;
  
  return Math.min(100, Math.max(0, riskScore));
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};


