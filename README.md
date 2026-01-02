# Loan Tracker Application

A comprehensive loan tracking dashboard built with React and Vite. Track loans, payments, obligations, and receive automated alerts.

## Features

- 🔐 **Email Authentication** - Secure login with email via Privy
- 📊 **Dashboard** - Overview of portfolio with key metrics and recent activity
- 💰 **Loan Management** - Full CRUD operations for loans with detailed views
- 📅 **Payment Tracking** - Automatic payment schedule generation and tracking
- ✅ **Obligations Management** - Track financial, reporting, and operational obligations
- 🔔 **Smart Alerts** - Automated alerts for payments due, overdue items, and risk warnings
- 📈 **Analytics** - Visual charts showing loan status distribution and top loans
- 🔍 **Search & Filter** - Powerful filtering by status, borrower, amount, and dates
- 💾 **Data Persistence** - All data saved to localStorage automatically

## Tech Stack

- React 19
- Vite
- React Router DOM
- Zustand (State Management)
- Recharts (Charts)
- Tailwind CSS
- date-fns
- Lucide React (Icons)
- Privy (Authentication)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Privy account (free at [privy.io](https://privy.io))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Privy authentication:
   - Create a free account at [privy.io](https://privy.io)
   - Create a new app in the Privy dashboard
   - Copy your App ID
   - Create a `.env` file in the root directory:
   ```bash
   VITE_PRIVY_APP_ID=your_privy_app_id_here
   ```
   - Replace `your_privy_app_id_here` with your actual Privy App ID

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Key Pages

- **Login** (`/login`) - Email authentication page
- **Dashboard** (`/`) - Main overview with stats and recent loans (protected)
- **All Loans** (`/loans`) - List of all loans with search and filters (protected)
- **Loan Detail** (`/loans/:id`) - Detailed view of a single loan (protected)
- **New Loan** (`/loans/new`) - Form to create a new loan (protected)
- **Analytics** (`/analytics`) - Charts and visualizations (protected)
- **Alerts** (`/alerts`) - View and manage alerts (protected)

## Mock Data

The application comes with 12 pre-generated sample loans with realistic data including:
- Various loan amounts and interest rates
- Payment schedules
- Obligations
- Different statuses (on track, at risk, overdue, paid off)

## Features in Detail

### Loan Status
Loans automatically update their status based on:
- Payment history (overdue payments)
- Obligation compliance
- Time to maturity
- Risk factors

### Risk Scoring
Each loan has a calculated risk score (0-100) based on:
- Payment history
- Obligation compliance
- Time to maturity
- Current status

### Alerts
Automated alerts are generated for:
- Payments due within 7 days
- Overdue payments
- Obligations due within 14 days
- High-risk loans (risk score > 70)

### Payment Schedule
When creating a loan, a complete payment schedule is automatically generated using standard amortization formulas, including:
- Monthly payment amounts
- Principal and interest breakdown
- Due dates

## Development

### Adding New Features

1. **New Pages**: Add to `src/pages/` and register route in `src/App.jsx`
2. **New Components**: Add to `src/components/`
3. **Store Updates**: Modify `src/store/useLoanStore.js`
4. **Utilities**: Add helper functions to `src/utils/`

### State Management

The app uses Zustand for state management. The main store is in `src/store/useLoanStore.js` and includes:
- Loan CRUD operations
- Filtering and search
- Alert generation
- Portfolio statistics

## License

MIT
