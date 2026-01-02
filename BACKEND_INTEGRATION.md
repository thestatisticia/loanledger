# Backend Integration Guide

## Overview

This guide explains how to integrate the Loan Tracker app with a backend API to replace localStorage with persistent server-side storage.

## Current Architecture

Currently, the app uses:
- **Frontend**: React + Zustand for state management
- **Storage**: Browser localStorage (user-specific keys)
- **Authentication**: Privy (handles user authentication)

## Backend Options

### Option 1: REST API with Node.js/Express

**Recommended for**: Full control, custom business logic

**Tech Stack**:
- Backend: Node.js + Express
- Database: PostgreSQL or MongoDB
- Authentication: Privy backend SDK for token verification

### Option 2: Firebase/Firestore

**Recommended for**: Quick setup, real-time features

**Tech Stack**:
- Backend: Firebase (Google)
- Database: Firestore
- Authentication: Privy + Firebase Auth integration

### Option 3: Supabase

**Recommended for**: PostgreSQL with real-time, built-in auth

**Tech Stack**:
- Backend: Supabase
- Database: PostgreSQL
- Authentication: Privy + Supabase Auth

### Option 4: Custom Backend (Python/Django, Ruby/Rails, etc.)

**Recommended for**: Existing backend infrastructure

## Recommended: Node.js + Express + PostgreSQL

### Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── loans.js
│   │   ├── borrowers.js
│   │   └── payments.js
│   ├── models/
│   │   ├── Loan.js
│   │   ├── Borrower.js
│   │   └── Payment.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   │   ├── loanController.js
│   │   └── borrowerController.js
│   └── config/
│       └── database.js
├── package.json
└── .env
```

### Database Schema

```sql
-- Users/Companies table (managed by Privy, but we track their ID)
CREATE TABLE companies (
  id VARCHAR(255) PRIMARY KEY, -- Privy user ID
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Borrowers table
CREATE TABLE borrowers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  contact_info TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email, name)
);

-- Loans table
CREATE TABLE loans (
  id VARCHAR(255) PRIMARY KEY,
  borrower_id INTEGER REFERENCES borrowers(id),
  borrower_email VARCHAR(255),
  borrower_name VARCHAR(255) NOT NULL,
  managed_by VARCHAR(255) REFERENCES companies(id), -- Company managing this loan
  amount DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  term INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'on_track',
  risk_score INTEGER DEFAULT 50,
  borrower_contact TEXT,
  borrower_phone VARCHAR(50),
  loan_officer VARCHAR(255),
  tags TEXT[], -- Array of tags
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id VARCHAR(255) PRIMARY KEY,
  loan_id VARCHAR(255) REFERENCES loans(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Obligations table
CREATE TABLE obligations (
  id VARCHAR(255) PRIMARY KEY,
  loan_id VARCHAR(255) REFERENCES loans(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id VARCHAR(255) PRIMARY KEY,
  loan_id VARCHAR(255) REFERENCES loans(id) ON DELETE CASCADE,
  date TIMESTAMP DEFAULT NOW(),
  author VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Communications table
CREATE TABLE communications (
  id VARCHAR(255) PRIMARY KEY,
  loan_id VARCHAR(255) REFERENCES loans(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  direction VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  content TEXT NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  author VARCHAR(255),
  recipient VARCHAR(255),
  status VARCHAR(50),
  automated BOOLEAN DEFAULT FALSE,
  related_payment_id VARCHAR(255),
  related_obligation_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Loans

```javascript
// Get all loans managed by company
GET /api/loans
Headers: { Authorization: 'Bearer <privy_token>' }

// Get loans by borrower (email/name)
GET /api/loans/borrower?email=user@example.com&name=John Doe
Headers: { Authorization: 'Bearer <privy_token>' }

// Get single loan
GET /api/loans/:id
Headers: { Authorization: 'Bearer <privy_token>' }

// Create loan
POST /api/loans
Headers: { Authorization: 'Bearer <privy_token>' }
Body: {
  borrower: "John Doe",
  borrowerEmail: "john@example.com",
  amount: 50000,
  interestRate: 5.5,
  term: 36,
  startDate: "2024-01-15",
  // ... other fields
}

// Update loan
PUT /api/loans/:id
Headers: { Authorization: 'Bearer <privy_token>' }
Body: { /* updates */ }

// Delete loan
DELETE /api/loans/:id
Headers: { Authorization: 'Bearer <privy_token>' }
```

#### Payments

```javascript
// Update payment status
PATCH /api/loans/:loanId/payments/:paymentId
Headers: { Authorization: 'Bearer <privy_token>' }
Body: {
  status: "paid",
  paidDate: "2024-01-15"
}
```

### Authentication Middleware

```javascript
// middleware/auth.js
const { verifyAccessToken } = require('@privy-io/server-auth');

async function verifyPrivyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const claims = await verifyAccessToken(token);
    req.user = {
      id: claims.userId,
      email: claims.email
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Frontend Integration

#### 1. Create API Service

```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function getAuthToken() {
  // Get Privy token
  const { getAccessToken } = usePrivy();
  return await getAccessToken();
}

export const api = {
  async get(endpoint) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  async post(endpoint, data) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async put(endpoint, data) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async delete(endpoint) {
    const token = await getAuthToken();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  }
};
```

#### 2. Update Store to Use API

```javascript
// src/store/useLoanStore.js
import { api } from '../services/api';

const useLoanStore = create((set, get) => ({
  loans: [],
  loading: false,
  error: null,

  // Fetch loans from API
  fetchLoans: async () => {
    set({ loading: true, error: null });
    try {
      const loans = await api.get('/loans');
      set({ loans, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Add loan via API
  addLoan: async (loan) => {
    try {
      const newLoan = await api.post('/loans', loan);
      set((state) => ({
        loans: [...state.loans, newLoan]
      }));
      return newLoan;
    } catch (error) {
      console.error('Error adding loan:', error);
      throw error;
    }
  },

  // Update payment via API
  updatePaymentStatus: async (loanId, paymentId, status, paidDate) => {
    try {
      await api.patch(`/loans/${loanId}/payments/${paymentId}`, {
        status,
        paidDate
      });
      // Refresh loan data
      await get().fetchLoans();
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }
}));
```

### Environment Variables

```bash
# .env (backend)
DATABASE_URL=postgresql://user:password@localhost:5432/loantracker
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
PORT=3000
```

```bash
# .env (frontend)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PRIVY_APP_ID=your_privy_app_id
```

### Migration Strategy

1. **Phase 1**: Keep localStorage, add API calls in parallel
2. **Phase 2**: Sync localStorage with backend on login
3. **Phase 3**: Remove localStorage, use API only

### Example Backend Implementation (Express)

```javascript
// routes/loans.js
const express = require('express');
const router = express.Router();
const { verifyPrivyToken } = require('../middleware/auth');
const { getLoans, createLoan, updateLoan, deleteLoan } = require('../controllers/loanController');

router.get('/', verifyPrivyToken, getLoans);
router.get('/borrower', verifyPrivyToken, getLoansByBorrower);
router.get('/:id', verifyPrivyToken, getLoan);
router.post('/', verifyPrivyToken, createLoan);
router.put('/:id', verifyPrivyToken, updateLoan);
router.delete('/:id', verifyPrivyToken, deleteLoan);

module.exports = router;
```

```javascript
// controllers/loanController.js
const Loan = require('../models/Loan');

exports.getLoans = async (req, res) => {
  try {
    // Get all loans managed by this company
    const loans = await Loan.findByManager(req.user.id);
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoansByBorrower = async (req, res) => {
  try {
    const { email, name } = req.query;
    const loans = await Loan.findByBorrower(email, name, req.user.id);
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLoan = async (req, res) => {
  try {
    const loanData = {
      ...req.body,
      managedBy: req.user.id,
      borrowerIdentifier: req.body.borrowerEmail?.toLowerCase() || req.body.borrower?.toLowerCase()
    };
    const loan = await Loan.create(loanData);
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

## Quick Start: Supabase Integration

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Get your API URL and anon key

### 2. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 3. Create Supabase Client

```javascript
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 4. Use in Store

```javascript
// Fetch loans
const { data: loans } = await supabase
  .from('loans')
  .select('*')
  .eq('managed_by', userId);

// Create loan
const { data: loan } = await supabase
  .from('loans')
  .insert([loanData])
  .select()
  .single();
```

## Next Steps

1. Choose your backend solution
2. Set up database schema
3. Implement API endpoints
4. Update frontend to use API
5. Test migration from localStorage
6. Deploy backend and frontend

## Support

For questions or issues with backend integration, refer to:
- Privy Backend SDK: https://docs.privy.io/guide/server/backend-sdk
- Your chosen backend framework documentation


