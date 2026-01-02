# Payment Tracking System Documentation

## Overview

The Loan Tracker app automatically tracks loan payments and updates loan status based on payment schedules. This document explains how the payment tracking system works and how to update payment information.

## How Payment Tracking Works

### 1. Payment Schedule Generation

When a loan is created, a **payment schedule** is automatically generated based on:
- Loan amount (principal)
- Interest rate (annual percentage)
- Loan term (number of months)
- Start date

The system uses standard amortization formulas to calculate:
- Monthly payment amount
- Principal portion of each payment
- Interest portion of each payment
- Due date for each payment

**Location**: `src/utils/loanHelpers.js` → `generatePaymentSchedule()`

### 2. Payment Status

Each payment in the schedule has a status:

- **`pending`**: Payment is not yet due or has not been paid
- **`paid`**: Payment has been received
- **`overdue`**: Payment is past due date and not paid
- **`partial`**: Partial payment received (future feature)

### 3. Automatic Loan Status Calculation

The loan's overall status is **automatically calculated** based on payment history:

**Status Priority** (checked in order):
1. **`defaulted`**: 3 or more overdue payments
2. **`paid_off`**: All payments are marked as paid
3. **`overdue`**: Has at least one overdue payment
4. **`at_risk`**: Has payments due within 7 days OR incomplete obligations past due
5. **`on_track`**: All payments are on time and obligations are met

**Location**: `src/utils/loanHelpers.js` → `determineLoanStatus()`

### 4. Payment Status Updates

When you update a payment status, the system:
1. Updates the payment's `status` and `paidDate`
2. Automatically recalculates the loan's overall status
3. Updates the loan's risk score
4. Regenerates alerts if needed

**Location**: `src/store/useLoanStore.js` → `updatePaymentStatus()`

## How to Update Payment Information

### Method 1: Through the Loan Detail Page (UI)

1. Navigate to a loan detail page (`/loans/:id`)
2. Scroll to the "Payment Schedule" section
3. Find the payment you want to update
4. Click **"Mark Paid"** button for pending payments
5. The system will:
   - Mark the payment as paid
   - Set the paid date to today
   - Automatically recalculate loan status
   - Update risk score
   - Refresh the page to show changes

### Method 2: Programmatically (Code)

```javascript
import useLoanStore from './store/useLoanStore';

const { updatePaymentStatus } = useLoanStore();

// Mark a payment as paid
updatePaymentStatus(
  loanId,        // e.g., 'loan-123'
  paymentId,     // e.g., 'payment-loan-123-1'
  'paid',        // status
  '2024-01-15'   // paidDate (ISO format, optional - defaults to today)
);

// Mark a payment as overdue
updatePaymentStatus(
  loanId,
  paymentId,
  'overdue',
  null  // No paid date for overdue
);
```

### Method 3: Direct Data Import

When importing loans via CSV/Excel:
- Payments are automatically generated based on loan terms
- You can manually edit payment statuses after import
- Or import loans with existing payment history in JSON format

## Payment Data Structure

Each payment object contains:

```javascript
{
  id: "payment-loan-123-1",           // Unique payment ID
  dueDate: "2024-02-15",               // Due date (ISO format)
  amount: 1500.00,                      // Total payment amount
  status: "pending",                    // Status: pending | paid | overdue | partial
  paidDate: null,                       // Date paid (ISO format, null if not paid)
  principalAmount: 1200.00,            // Principal portion
  interestAmount: 300.00,              // Interest portion
  notes: ""                             // Optional notes
}
```

## Automatic Status Updates

The loan status is **automatically recalculated** whenever:
- A payment status is updated
- A loan is enriched (via `enrichLoan()` function)
- Alerts are generated
- The loan detail page is viewed

**No manual status updates needed!** The system handles this automatically.

## Alert Generation

The system automatically generates alerts for:
- **Payment due soon**: Payments due within 7 days
- **Payment overdue**: Payments past their due date
- **Obligation due**: Obligations due within 14 days
- **High risk loans**: Loans with risk score > 70

**Location**: `src/store/useLoanStore.js` → `generateAlerts()`

## Risk Score Calculation

Risk scores (0-100) are automatically calculated based on:
- Payment history (overdue payments increase risk)
- Obligation compliance (incomplete obligations increase risk)
- Time to maturity (approaching maturity increases risk)
- Current loan status

**Location**: `src/utils/calculations.js` → `calculateRiskScore()`

## Best Practices

1. **Update payments promptly**: Mark payments as paid when received to keep loan status accurate
2. **Check alerts regularly**: The system generates alerts for upcoming and overdue payments
3. **Review loan status**: Loan status updates automatically, but review regularly for accuracy
4. **Use payment notes**: Add notes to payments for important information (future feature)

## Troubleshooting

### Payment status not updating?
- Refresh the page after marking a payment as paid
- Check browser console for errors
- Verify the payment ID is correct

### Loan status seems incorrect?
- Check individual payment statuses
- Verify payment due dates are correct
- Review obligations that might affect status

### Payments not generating?
- Verify loan has valid: amount, interest rate, term, and start date
- Check that `generatePaymentSchedule()` is called when creating loans
- Ensure loan data structure is correct

## Technical Details

### Key Functions

- **`generatePaymentSchedule(loan)`**: Creates payment schedule for a loan
- **`determineLoanStatus(loan)`**: Calculates loan status from payments/obligations
- **`enrichLoan(loan)`**: Updates loan with calculated fields (status, risk score)
- **`updatePaymentStatus(loanId, paymentId, status, paidDate)`**: Updates payment and recalculates loan status
- **`calculateRiskScore(loan)`**: Calculates risk score (0-100)

### Data Flow

1. Loan created → Payment schedule generated
2. Payment updated → Loan enriched → Status recalculated
3. Status changed → Alerts regenerated
4. UI refreshed → New status displayed

## Future Enhancements

- Partial payment support
- Payment history timeline
- Automated payment reminders
- Payment receipt upload
- Bulk payment updates
- Payment analytics and trends


