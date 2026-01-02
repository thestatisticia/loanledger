/**
 * Data type definitions for the Loan Tracker application
 */

/**
 * @typedef {Object} Payment
 * @property {string} id - Unique payment ID
 * @property {string} dueDate - Payment due date (ISO string)
 * @property {number} amount - Payment amount
 * @property {string} status - Payment status: 'pending' | 'paid' | 'overdue' | 'partial'
 * @property {string|null} paidDate - Date payment was made (ISO string or null)
 * @property {number} principalAmount - Principal portion of payment
 * @property {number} interestAmount - Interest portion of payment
 * @property {string} [notes] - Optional payment notes
 */

/**
 * @typedef {Object} Obligation
 * @property {string} id - Unique obligation ID
 * @property {string} type - Obligation type: 'financial' | 'reporting' | 'operational' | 'covenant'
 * @property {string} title - Obligation title/description
 * @property {string} dueDate - Due date (ISO string)
 * @property {boolean} completed - Whether obligation is completed
 * @property {string|null} completedDate - Date completed (ISO string or null)
 * @property {string} [description] - Detailed description
 * @property {string[]} [documents] - Array of document URLs/names
 * @property {string} [notes] - Optional notes
 */

/**
 * @typedef {Object} Note
 * @property {string} id - Unique note ID
 * @property {string} date - Note date (ISO string)
 * @property {string} author - Author name
 * @property {string} content - Note content
 */

/**
 * @typedef {Object} Communication
 * @property {string} id - Unique communication ID
 * @property {string} loanId - Associated loan ID
 * @property {string} type - Communication type: 'email' | 'sms' | 'call' | 'meeting' | 'note' | 'system'
 * @property {string} direction - 'outbound' | 'inbound'
 * @property {string} subject - Communication subject/title
 * @property {string} content - Communication content/message
 * @property {string} date - Communication date (ISO string)
 * @property {string} author - Author/sender name
 * @property {string} [recipient] - Recipient name/email/phone
 * @property {string} [status] - Status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending'
 * @property {boolean} [automated] - Whether this was an automated communication
 * @property {string} [relatedPaymentId] - Related payment ID if applicable
 * @property {string} [relatedObligationId] - Related obligation ID if applicable
 */

/**
 * @typedef {Object} Loan
 * @property {string} id - Unique loan ID
 * @property {string} borrower - Borrower name/company
 * @property {number} amount - Loan principal amount
 * @property {number} interestRate - Annual interest rate (percentage)
 * @property {number} term - Loan term in months
 * @property {string} startDate - Loan start date (ISO string)
 * @property {string} endDate - Loan end date (ISO string)
 * @property {string} status - Loan status: 'on_track' | 'at_risk' | 'overdue' | 'paid_off' | 'defaulted'
 * @property {Payment[]} paymentSchedule - Array of scheduled payments
 * @property {Obligation[]} obligations - Array of loan obligations
 * @property {Note[]} notes - Array of loan notes
 * @property {Communication[]} communications - Array of communications
 * @property {number} riskScore - Risk score (0-100)
 * @property {string[]} tags - Array of tags for categorization
 * @property {string} [borrowerContact] - Borrower contact information
 * @property {string} [borrowerEmail] - Borrower email
 * @property {string} [borrowerPhone] - Borrower phone
 * @property {string} [loanOfficer] - Assigned loan officer
 */

/**
 * @typedef {Object} Alert
 * @property {string} id - Unique alert ID
 * @property {string} loanId - Associated loan ID
 * @property {string} type - Alert type: 'payment_due' | 'payment_overdue' | 'covenant_breach' | 'obligation_due' | 'risk_warning'
 * @property {string} severity - Alert severity: 'low' | 'medium' | 'high' | 'critical'
 * @property {string} title - Alert title
 * @property {string} message - Alert message
 * @property {string} date - Alert date (ISO string)
 * @property {boolean} read - Whether alert has been read
 * @property {string} [actionUrl] - Optional URL to navigate to for action
 */

/**
 * @typedef {Object} FilterState
 * @property {string[]} status - Filter by loan status
 * @property {string[]} borrowers - Filter by borrower names
 * @property {number|null} minAmount - Minimum loan amount
 * @property {number|null} maxAmount - Maximum loan amount
 * @property {string|null} startDateFrom - Filter loans starting from date
 * @property {string|null} startDateTo - Filter loans starting to date
 * @property {string} searchQuery - Text search query
 */

/**
 * @typedef {Object} PortfolioStats
 * @property {number} totalLoans - Total number of loans
 * @property {number} totalAmount - Total loan amount
 * @property {number} activeLoans - Number of active loans
 * @property {number} overdueLoans - Number of overdue loans
 * @property {number} atRiskLoans - Number of at-risk loans
 * @property {number} weightedAvgInterest - Weighted average interest rate
 * @property {number} totalOutstanding - Total outstanding principal
 * @property {number} totalPaid - Total amount paid
 */

export {};

