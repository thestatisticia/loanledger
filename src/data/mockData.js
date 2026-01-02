/**
 * Mock data for the Loan Tracker application
 * This provides realistic sample data for development and demo purposes
 */

const generateMockLoans = () => {
  const borrowers = [
    'Acme Corporation',
    'TechStart Inc.',
    'Global Manufacturing Ltd.',
    'Retail Ventures LLC',
    'Healthcare Solutions',
    'Energy Systems Co.',
    'Food & Beverage Group',
    'Real Estate Holdings',
    'Transportation Services',
    'Media & Entertainment Corp'
  ];

  const loanOfficers = [
    'Sarah Johnson',
    'Michael Chen',
    'Emily Rodriguez',
    'David Thompson',
    'Jessica Williams'
  ];

  const tags = [
    'Commercial',
    'Real Estate',
    'Equipment',
    'Working Capital',
    'Term Loan',
    'Revolving',
    'SBA',
    'High Priority'
  ];

  const obligations = [
    {
      type: 'financial',
      title: 'Maintain debt-to-equity ratio below 2.0',
      description: 'Quarterly financial statements must show debt-to-equity ratio below 2.0'
    },
    {
      type: 'reporting',
      title: 'Submit quarterly financial statements',
      description: 'Quarterly financial statements due within 45 days of quarter end'
    },
    {
      type: 'operational',
      title: 'Maintain insurance coverage',
      description: 'Property and liability insurance must remain in force'
    },
    {
      type: 'covenant',
      title: 'Minimum liquidity requirement',
      description: 'Maintain minimum cash balance of $100,000'
    },
    {
      type: 'reporting',
      title: 'Annual audit report',
      description: 'Annual audited financial statements required'
    }
  ];

  const loans = [];
  const statuses = ['on_track', 'on_track', 'on_track', 'at_risk', 'overdue', 'paid_off'];
  
  for (let i = 0; i < 12; i++) {
    const borrower = borrowers[i % borrowers.length];
    const amount = Math.floor(Math.random() * 2000000) + 100000; // $100k - $2M
    const interestRate = Math.random() * 5 + 3; // 3% - 8%
    const term = [12, 24, 36, 48, 60][Math.floor(Math.random() * 5)];
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * term));
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + term);
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate payment schedule
    const paymentSchedule = [];
    const monthlyPayment = amount * (interestRate / 100 / 12) * (1 + interestRate / 100 / 12) ** term / 
                          ((1 + interestRate / 100 / 12) ** term - 1);
    
    let remainingPrincipal = amount;
    const monthlyRate = interestRate / 100 / 12;
    
    for (let j = 0; j < term; j++) {
      const interestAmount = remainingPrincipal * monthlyRate;
      const principalAmount = monthlyPayment - interestAmount;
      remainingPrincipal -= principalAmount;
      
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + j + 1);
      
      let paymentStatus = 'pending';
      let paidDate = null;
      
      if (dueDate < new Date()) {
        if (status === 'paid_off' || j < term - 3) {
          paymentStatus = 'paid';
          paidDate = new Date(dueDate);
          paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 5));
        } else if (status === 'overdue' && j === term - 1) {
          paymentStatus = 'overdue';
        } else if (status === 'at_risk' && j === term - 1) {
          paymentStatus = 'pending';
        } else {
          paymentStatus = 'paid';
          paidDate = new Date(dueDate);
          paidDate.setDate(paidDate.getDate() + Math.floor(Math.random() * 3));
        }
      }
      
      paymentSchedule.push({
        id: `payment-${i}-${j}`,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: monthlyPayment,
        status: paymentStatus,
        paidDate: paidDate ? paidDate.toISOString().split('T')[0] : null,
        principalAmount: principalAmount,
        interestAmount: interestAmount,
        notes: ''
      });
    }
    
    // Generate obligations
    const loanObligations = [];
    const numObligations = Math.floor(Math.random() * 3) + 2;
    const selectedObligations = obligations
      .sort(() => Math.random() - 0.5)
      .slice(0, numObligations);
    
    selectedObligations.forEach((obligation, idx) => {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (idx + 1) * 3);
      
      const completed = Math.random() > 0.3 && dueDate < new Date();
      const completedDate = completed ? new Date(dueDate) : null;
      if (completedDate) {
        completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 10));
      }
      
      loanObligations.push({
        id: `obligation-${i}-${idx}`,
        type: obligation.type,
        title: obligation.title,
        dueDate: dueDate.toISOString().split('T')[0],
        completed: completed,
        completedDate: completedDate ? completedDate.toISOString().split('T')[0] : null,
        description: obligation.description,
        documents: [],
        notes: ''
      });
    });
    
    // Generate notes
    const notes = [];
    if (Math.random() > 0.5) {
      notes.push({
        id: `note-${i}-1`,
        date: new Date().toISOString().split('T')[0],
        author: loanOfficers[Math.floor(Math.random() * loanOfficers.length)],
        content: 'Initial loan review completed. Borrower in good standing.'
      });
    }
    
    // Select random tags
    const loanTags = tags
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1);
    
    loans.push({
      id: `loan-${String(i + 1).padStart(3, '0')}`,
      borrower,
      amount,
      interestRate: parseFloat(interestRate.toFixed(2)),
      term,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status,
      paymentSchedule,
      obligations: loanObligations,
      notes,
      communications: [], // Will be populated as communications are added
      riskScore: Math.floor(Math.random() * 40) + 20, // Will be recalculated
      tags: loanTags,
      borrowerContact: `${borrower} - Main Office`,
      borrowerEmail: `${borrower.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      borrowerPhone: `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      loanOfficer: loanOfficers[Math.floor(Math.random() * loanOfficers.length)]
    });
  }
  
  return loans;
};

export const mockLoans = generateMockLoans();

