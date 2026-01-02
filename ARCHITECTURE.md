# Loan Tracker - Architecture Documentation

## Overview

This is a React-based loan tracking application built with Vite, featuring a comprehensive dashboard for managing loans, obligations, payments, and alerts.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Zustand** - State management with persistence
- **Recharts** - Data visualization
- **date-fns** - Date manipulation utilities
- **Lucide React** - Icon library
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Main layout component with navigation
├── pages/              # Page components (routes)
│   ├── Dashboard/     # Main dashboard with overview
│   ├── Loans/         # Loans list and detail views
│   ├── LoanDetail/    # Individual loan detail page
│   ├── Analytics/     # Analytics and charts
│   ├── Alerts/        # Alerts management
│   └── NewLoan/       # Form to create new loans
├── store/             # Zustand state management
│   └── useLoanStore.js # Main store with all loan operations
├── data/               # Mock data and seed data
│   └── mockData.js    # Generated sample loans
├── utils/             # Utility functions
│   ├── dateHelpers.js # Date formatting and manipulation
│   ├── calculations.js # Loan calculations (payments, interest, etc.)
│   └── loanHelpers.js # Loan-specific utilities (status, filtering, etc.)
├── types/             # TypeScript-style JSDoc type definitions
│   └── index.js       # Data model types
├── App.jsx            # Main app component with routing
└── main.jsx          # Entry point
```

## State Management (Zustand)

The application uses Zustand for state management with localStorage persistence. The store (`useLoanStore`) manages:

- **Loans**: Array of all loans with CRUD operations
- **Filters**: Search and filter state
- **Selected Loan**: Currently viewed loan
- **Alerts**: Generated alerts based on loan status

### Key Store Methods

- `addLoan(loan)` - Add a new loan
- `updateLoan(id, updates)` - Update loan properties
- `deleteLoan(id)` - Remove a loan
- `getLoan(id)` - Retrieve a loan by ID
- `getFilteredLoans()` - Get loans matching current filters
- `updatePaymentStatus(loanId, paymentId, status)` - Update payment status
- `updateObligationStatus(loanId, obligationId, completed)` - Mark obligation complete
- `generateAlerts()` - Generate alerts based on loan status
- `getPortfolioStats()` - Calculate portfolio statistics

## Data Models

### Loan
- Basic info: borrower, amount, interest rate, term, dates
- Status: on_track, at_risk, overdue, paid_off, defaulted
- Payment schedule: Array of scheduled payments
- Obligations: Financial, reporting, operational, covenant requirements
- Notes: Activity log and comments
- Risk score: Calculated risk metric (0-100)

### Payment
- Due date, amount, status (pending/paid/overdue/partial)
- Principal and interest breakdown
- Payment date and notes

### Obligation
- Type: financial, reporting, operational, covenant
- Title, description, due date
- Completion status and date
- Associated documents

### Alert
- Type: payment_due, payment_overdue, obligation_due, covenant_breach, risk_warning
- Severity: low, medium, high, critical
- Associated loan and action URL

## Routing

- `/` - Dashboard (overview and stats)
- `/loans` - All loans list with filters
- `/loans/:id` - Individual loan detail
- `/loans/new` - Create new loan form
- `/analytics` - Charts and analytics
- `/alerts` - Alerts management

## Key Features

### 1. Dashboard
- Portfolio statistics (total amount, active loans, at-risk, overdue)
- Recent loans list
- Critical alerts feed
- Quick navigation

### 2. Loans Management
- List view with search and filters
- Status-based filtering
- Borrower filtering
- Detailed loan view with:
  - Payment schedule table
  - Obligations list
  - Loan information

### 3. Analytics
- Status distribution pie chart
- Top loans by amount bar chart
- Portfolio overview metrics

### 4. Alerts System
- Automatic alert generation based on:
  - Payment due dates (7, 3, 1 day warnings)
  - Overdue payments
  - Obligation due dates
  - High risk loans
- Severity-based categorization
- Read/unread status

### 5. Loan Creation
- Form to create new loans
- Automatic payment schedule generation
- End date calculation

## Utility Functions

### Date Helpers (`utils/dateHelpers.js`)
- `formatDate()` - Format dates in various formats
- `isDatePast()` / `isDateFuture()` - Date comparison
- `daysUntil()` - Calculate days until a date
- `isWithinDays()` - Check if date is within N days

### Calculations (`utils/calculations.js`)
- `calculateMonthlyPayment()` - Amortization calculation
- `calculateTotalInterest()` - Total interest over loan term
- `calculateRemainingPrincipal()` - Remaining balance after N payments
- `calculateLoanProgress()` - Progress metrics
- `calculateRiskScore()` - Risk assessment algorithm
- `formatCurrency()` / `formatPercentage()` - Formatting helpers

### Loan Helpers (`utils/loanHelpers.js`)
- `determineLoanStatus()` - Auto-determine status from payments/obligations
- `getStatusColor()` / `getStatusText()` - Status UI helpers
- `generatePaymentSchedule()` - Create payment schedule for new loan
- `enrichLoan()` - Add calculated fields (status, risk score)
- `filterLoans()` - Filter loans based on criteria

## Mock Data

The application includes a comprehensive mock data generator that creates:
- 12 sample loans with varied statuses
- Realistic payment schedules
- Multiple obligations per loan
- Various borrowers and loan amounts
- Different risk profiles

## Styling

- Tailwind CSS for utility-first styling
- Responsive design (mobile, tablet, desktop)
- Color-coded status indicators
- Consistent spacing and typography

## Future Enhancements

- Backend integration (Firebase, Supabase, or REST API)
- User authentication
- Multi-user support
- Document upload/management
- Email notifications
- Export to CSV/PDF
- Advanced reporting
- Payment recording interface
- Obligation completion workflow
- Notes/activity timeline
- Risk scoring refinements

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Notes

- Data persists in localStorage via Zustand's persist middleware
- All calculations use standard financial formulas
- Status is automatically determined based on payment and obligation status
- Alerts are generated on-demand when navigating to alerts page or dashboard




