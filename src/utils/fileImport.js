/**
 * File import utilities for CSV and Excel files
 * Parses files and converts them to loan objects
 */

import * as XLSX from 'xlsx';
import { enrichLoan, generatePaymentSchedule } from './loanHelpers';
import { getUserStorageKey } from './userData';
import useLoanStore from '../store/useLoanStore';

/**
 * Parse CSV file and convert to loan objects
 * Expected CSV format:
 * borrower,amount,interestRate,term,startDate,endDate,borrowerEmail,borrowerPhone,loanOfficer
 */
export const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Map common banking/financial column names to our standard names
  const columnMapping = {
    // Borrower/Name variations
    'borrower': 'borrower',
    'borrower name': 'borrower',
    'name': 'borrower',
    'customer name': 'borrower',
    'client name': 'borrower',
    'applicant name': 'borrower',
    'customer': 'borrower',
    'client': 'borrower',
    'id': 'borrower', // Sometimes ID is used as name
    'customer id': 'borrower',
    'client id': 'borrower',
    
    // Amount variations
    'amount': 'amount',
    'loan amount': 'amount',
    'principal': 'amount',
    'principal amount': 'amount',
    'loan principal': 'amount',
    'loan value': 'amount',
    'funded amount': 'amount',
    'disbursed amount': 'amount',
    
    // Interest rate variations
    'interestrate': 'interestrate',
    'interest rate': 'interestrate',
    'apr': 'interestrate',
    'rate': 'interestrate',
    'annual rate': 'interestrate',
    'interest': 'interestrate',
    'int rate': 'interestrate',
    
    // Term variations
    'term': 'term',
    'loan term': 'term',
    'months': 'term',
    'duration': 'term',
    'tenure': 'term',
    'loan duration': 'term',
    'loan tenure': 'term',
    'period': 'term',
    
    // Start date variations
    'startdate': 'startdate',
    'start date': 'startdate',
    'issue date': 'startdate',
    'disbursement date': 'startdate',
    'origination date': 'startdate',
    'loan date': 'startdate',
    'opening date': 'startdate',
    'date': 'startdate', // Generic date field
    
    // End date variations
    'enddate': 'enddate',
    'end date': 'enddate',
    'maturity date': 'enddate',
    'due date': 'enddate',
    'closing date': 'enddate',
    
    // Email variations
    'borroweremail': 'borroweremail',
    'borrower email': 'borroweremail',
    'email': 'borroweremail',
    'customer email': 'borroweremail',
    'client email': 'borroweremail',
    
    // Phone variations
    'borrowerphone': 'borrowerphone',
    'borrower phone': 'borrowerphone',
    'phone': 'borrowerphone',
    'customer phone': 'borrowerphone',
    'client phone': 'borrowerphone',
    'contact': 'borrowerphone',
    
    // Status variations
    'status': 'status',
    'loan status': 'status',
    'current status': 'status'
  };
  
  // Normalize headers using mapping
  const normalizedHeaders = headers.map(h => {
    // Remove special characters and normalize
    const normalized = h.replace(/[_\s-]/g, ' ').trim().toLowerCase();
    return columnMapping[normalized] || normalized;
  });
  
  // Check if we have required fields (after normalization)
  const hasBorrower = normalizedHeaders.some(h => h.includes('borrower') || h === 'name' || h === 'customer' || h === 'client');
  const hasAmount = normalizedHeaders.some(h => h.includes('amount') || h === 'principal');
  const hasInterestRate = normalizedHeaders.some(h => h.includes('interest') || h.includes('rate') || h === 'apr');
  const hasTerm = normalizedHeaders.some(h => h === 'term' || h === 'months' || h === 'duration' || h === 'tenure');
  const hasStartDate = normalizedHeaders.some(h => h.includes('date') || h.includes('start') || h.includes('issue') || h.includes('disbursement'));
  
  if (!hasBorrower || !hasAmount || !hasInterestRate || !hasTerm || !hasStartDate) {
    const missing = [];
    if (!hasBorrower) missing.push('borrower/name/customer');
    if (!hasAmount) missing.push('amount/principal');
    if (!hasInterestRate) missing.push('interest rate/apr');
    if (!hasTerm) missing.push('term/months/duration');
    if (!hasStartDate) missing.push('start date/issue date');
    
    // Create helpful error message
    const errorMsg = `Missing required columns: ${missing.join(', ')}\n\n` +
      `Found columns in your file:\n${headers.map((h, i) => `  ${i + 1}. "${h}" (normalized: "${normalizedHeaders[i]}")`).join('\n')}\n\n` +
      `Please ensure your CSV has columns for:\n` +
      `- Borrower/Name/Customer (found: ${hasBorrower ? 'Yes' : 'No'})\n` +
      `- Amount/Principal (found: ${hasAmount ? 'Yes' : 'No'})\n` +
      `- Interest Rate/APR (found: ${hasInterestRate ? 'Yes' : 'No'})\n` +
      `- Term/Months/Duration (found: ${hasTerm ? 'Yes' : 'No'})\n` +
      `- Start Date/Issue Date (found: ${hasStartDate ? 'Yes' : 'No'})`;
    
    throw new Error(errorMsg);
  }

  const loans = [];
  
  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line) => {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          j++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        // End of value
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    // Add last value
    values.push(currentValue.trim());
    return values;
  };
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    
    // Handle mismatched column counts gracefully
    if (values.length < headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}, padding with empty values`);
      while (values.length < headers.length) {
        values.push('');
      }
    } else if (values.length > headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}, using first ${headers.length} columns`);
      values.splice(headers.length);
    }

    const loanData = {};
    headers.forEach((header, index) => {
      const normalizedHeader = normalizedHeaders[index];
      loanData[normalizedHeader] = values[index];
      // Also keep original header for fallback
      loanData[header] = values[index];
    });

    // Map CSV columns to loan object (try normalized first, then original, then check all headers)
    const getValue = (keys) => {
      // First try normalized headers
      for (const key of keys) {
        if (loanData[key] !== undefined && loanData[key] !== null && loanData[key] !== '') {
          return loanData[key];
        }
      }
      // Then try original headers (case-insensitive)
      for (const key of keys) {
        for (let j = 0; j < headers.length; j++) {
          const origHeader = headers[j].toLowerCase();
          if (origHeader.includes(key.toLowerCase()) || key.toLowerCase().includes(origHeader)) {
            if (values[j] !== undefined && values[j] !== null && values[j] !== '') {
              return values[j];
            }
          }
        }
      }
      return '';
    };
    
    // Extract values with better matching
    let borrower = getValue(['borrower', 'name', 'customer', 'client', 'id']) || '';
    // If still no borrower, try first non-empty column that might be a name
    if (!borrower) {
      for (let j = 0; j < values.length; j++) {
        const val = values[j]?.trim();
        if (val && !isNaN(val) === false && val.length > 0) {
          // Check if it looks like a name (not a number, not a date)
          if (!/^\d+$/.test(val) && !/^\d{4}-\d{2}-\d{2}/.test(val)) {
            borrower = val;
            break;
          }
        }
      }
    }
    
    let amount = parseFloat(getValue(['amount', 'principal', 'loan']) || 0);
    // If amount is 0, try to find any numeric column that could be amount
    if (!amount || isNaN(amount)) {
      for (let j = 0; j < values.length; j++) {
        const val = parseFloat(values[j]);
        if (!isNaN(val) && val > 1000) { // Likely an amount if > 1000
          amount = val;
          break;
        }
      }
    }
    
    let interestRate = parseFloat(getValue(['interestrate', 'interest', 'rate', 'apr']) || 0);
    // If rate is 0, try to find percentage-like values
    if (!interestRate || isNaN(interestRate)) {
      for (let j = 0; j < values.length; j++) {
        const val = parseFloat(values[j]);
        if (!isNaN(val) && val > 0 && val < 100) { // Likely a rate if between 0-100
          interestRate = val;
          break;
        }
      }
    }
    
    let term = parseInt(getValue(['term', 'months', 'duration', 'tenure', 'period']) || 0);
    // If term is 0, try to find month-like values
    if (!term || isNaN(term)) {
      for (let j = 0; j < values.length; j++) {
        const val = parseInt(values[j]);
        if (!isNaN(val) && val > 0 && val < 600) { // Likely a term if between 1-600 months
          term = val;
          break;
        }
      }
    }
    
    let startDate = getValue(['startdate', 'start', 'date', 'issue', 'disbursement', 'origination']) || '';
    // If no date, try to find date-like values
    if (!startDate) {
      for (let j = 0; j < values.length; j++) {
        const val = values[j]?.trim();
        if (val && /^\d{4}-\d{2}-\d{2}/.test(val) || /^\d{2}\/\d{2}\/\d{4}/.test(val) || /^\d{2}-\d{2}-\d{4}/.test(val)) {
          startDate = val;
          break;
        }
      }
    }
    if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
    }
    
    // Optional fields
    const endDate = getValue(['enddate', 'end date', 'maturity date', 'due date', 'closing date']) || null;
    const borrowerEmail = getValue(['borroweremail', 'borrower email', 'email', 'customer email', 'client email']) || '';
    const borrowerPhone = getValue(['borrowerphone', 'borrower phone', 'phone', 'customer phone', 'client phone', 'contact']) || '';
    const loanOfficer = getValue(['loanofficer', 'loan officer', 'officer']) || '';
    const status = getValue(['status', 'loan status', 'current status']) || 'on_track';

    // Validate required fields
    if (!borrower || !amount || isNaN(amount) || !interestRate || isNaN(interestRate) || !term || isNaN(term) || !startDate) {
      console.warn(`Row ${i + 1} is missing required fields, skipping`, {
        borrower,
        amount,
        interestRate,
        term,
        startDate,
        availableColumns: headers,
        normalizedColumns: normalizedHeaders
      });
      continue;
    }

    // Create loan object
    const loan = {
      id: loanData.id || `loan-import-${Date.now()}-${i}`,
      borrower,
      amount,
      interestRate,
      term,
      startDate: formatDateString(startDate),
      endDate: endDate ? formatDateString(endDate) : calculateEndDate(formatDateString(startDate), term),
      status,
      borrowerEmail,
      borrowerPhone,
      loanOfficer,
      obligations: [],
      notes: [],
      tags: [],
      communications: []
    };

    // Generate payment schedule if not provided
    if (!loanData.paymentschedule || loanData.paymentschedule === '') {
      loan.paymentSchedule = generatePaymentSchedule(loan);
    }

    loans.push(loan);
  }

  return loans;
};

/**
 * Parse Excel file (XLSX format)
 * Uses SheetJS library if available, otherwise falls back to CSV parsing
 */
export const parseExcel = async (file) => {
  // XLSX is imported at the top
  if (XLSX) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON - ensure all rows are included
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            defval: '', // Default value for empty cells
            raw: false // Convert dates and numbers to strings for consistent parsing
          });
          
          console.log(`Excel file parsed: ${jsonData.length} rows found`);
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }

          // Get all column names from first row for fallback matching
          const allColumns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
          console.log(`Found columns: ${allColumns.join(', ')}`);
          
          // Convert JSON rows to loan objects
          const loans = jsonData.map((row, index) => {
            // Normalize column names (case-insensitive)
            const normalizeKey = (key) => {
              const lower = key.toLowerCase().trim().replace(/[_\s-]/g, ' ');
              const mappings = {
                'borrower': 'borrower',
                'borrower name': 'borrower',
                'name': 'borrower',
                'customer name': 'borrower',
                'client name': 'borrower',
                'customer': 'borrower',
                'client': 'borrower',
                'amount': 'amount',
                'loan amount': 'amount',
                'principal': 'amount',
                'principal amount': 'amount',
                'loan principal': 'amount',
                'interestrate': 'interestRate',
                'interest rate': 'interestRate',
                'apr': 'interestRate',
                'rate': 'interestRate',
                'annual rate': 'interestRate',
                'interest': 'interestRate',
                'term': 'term',
                'loan term': 'term',
                'months': 'term',
                'duration': 'term',
                'tenure': 'term',
                'startdate': 'startDate',
                'start date': 'startDate',
                'issue date': 'startDate',
                'disbursement date': 'startDate',
                'origination date': 'startDate',
                'loan date': 'startDate',
                'date': 'startDate',
                'enddate': 'endDate',
                'end date': 'endDate',
                'maturity date': 'endDate',
                'due date': 'endDate',
                'closing date': 'endDate',
                'borroweremail': 'borrowerEmail',
                'borrower email': 'borrowerEmail',
                'email': 'borrowerEmail',
                'customer email': 'borrowerEmail',
                'borrowerphone': 'borrowerPhone',
                'borrower phone': 'borrowerPhone',
                'phone': 'borrowerPhone',
                'customer phone': 'borrowerPhone',
                'contact': 'borrowerPhone',
                'loanofficer': 'loanOfficer',
                'loan officer': 'loanOfficer',
                'officer': 'loanOfficer',
                'status': 'status',
                'loan status': 'status'
              };
              
              return mappings[lower] || lower;
            };

            const loanData = {};
            Object.keys(row).forEach(key => {
              const normalized = normalizeKey(key);
              loanData[normalized] = row[key];
              // Also keep original key for fallback
              loanData[key] = row[key];
            });

            // Helper function to get value with fallback matching (similar to CSV parser)
            const getValue = (keys) => {
              // First try normalized keys
              for (const key of keys) {
                if (loanData[key] !== undefined && loanData[key] !== null && loanData[key] !== '') {
                  return loanData[key];
                }
              }
              // Then try case-insensitive partial matching on original column names
              for (const key of keys) {
                for (const col of allColumns) {
                  const colLower = col.toLowerCase().trim();
                  const keyLower = key.toLowerCase().trim();
                  if (colLower.includes(keyLower) || keyLower.includes(colLower)) {
                    const val = row[col];
                    if (val !== undefined && val !== null && val !== '') {
                      return val;
                    }
                  }
                }
              }
              return '';
            };

            // Extract values with fallback logic
            let borrower = getValue(['borrower', 'name', 'customer', 'client']) || '';
            // If still no borrower, try first non-empty text column
            if (!borrower) {
              for (const col of allColumns) {
                const val = row[col];
                if (val && typeof val === 'string' && val.trim() && !isNaN(val) === false) {
                  // Check if it looks like a name (not a number, not a date)
                  if (!/^\d+$/.test(val) && !/^\d{4}-\d{2}-\d{2}/.test(val) && !/^\d{2}\/\d{2}\/\d{4}/.test(val)) {
                    borrower = val.trim();
                    break;
                  }
                }
              }
            }
            
            // Debug logging for borrower extraction
            if (index < 3) { // Log first 3 rows for debugging
              console.log(`Row ${index + 2} borrower extraction:`, {
                rowIndex: index + 2,
                borrower,
                allColumns,
                rowData: row,
                normalizedData: loanData
              });
            }

            let amount = parseFloat(getValue(['amount', 'principal', 'loan']) || 0);
            // If amount is 0, try to find any numeric column that could be amount
            if (!amount || isNaN(amount)) {
              for (const col of allColumns) {
                const val = parseFloat(row[col]);
                if (!isNaN(val) && val > 1000) { // Likely an amount if > 1000
                  amount = val;
                  break;
                }
              }
            }

            let interestRate = parseFloat(getValue(['interestRate', 'interest', 'rate', 'apr']) || 0);
            // If rate is 0, try to find percentage-like values
            if (!interestRate || isNaN(interestRate)) {
              for (const col of allColumns) {
                const val = parseFloat(row[col]);
                if (!isNaN(val) && val > 0 && val < 100) { // Likely a rate if between 0-100
                  interestRate = val;
                  break;
                }
              }
            }

            let term = parseInt(getValue(['term', 'months', 'duration', 'tenure']) || 0);
            // If term is 0, try to find month-like values
            if (!term || isNaN(term)) {
              for (const col of allColumns) {
                const val = parseInt(row[col]);
                if (!isNaN(val) && val > 0 && val < 600) { // Likely a term if between 1-600 months
                  term = val;
                  break;
                }
              }
            }

            let startDate = getValue(['startDate', 'start', 'date', 'issue', 'disbursement', 'origination']) || '';
            // If no date, try to find date-like values
            if (!startDate) {
              for (const col of allColumns) {
                const val = row[col];
                if (val) {
                  const valStr = String(val).trim();
                  if (/^\d{4}-\d{2}-\d{2}/.test(valStr) || /^\d{2}\/\d{2}\/\d{4}/.test(valStr) || /^\d{2}-\d{2}-\d{4}/.test(valStr)) {
                    startDate = valStr;
                    break;
                  }
                  // Also check if it's a Date object or Excel date serial number
                  if (val instanceof Date) {
                    startDate = val.toISOString().split('T')[0];
                    break;
                  }
                }
              }
            }
            if (!startDate) {
              startDate = new Date().toISOString().split('T')[0];
            }

            // Optional fields
            const endDate = getValue(['endDate', 'end date', 'maturity date', 'due date', 'closing date']) || null;
            const borrowerEmail = getValue(['borrowerEmail', 'borrower email', 'email', 'customer email']) || '';
            const borrowerPhone = getValue(['borrowerPhone', 'borrower phone', 'phone', 'customer phone', 'contact']) || '';
            const loanOfficer = getValue(['loanOfficer', 'loan officer', 'officer']) || '';
            const status = getValue(['status', 'loan status', 'current status']) || 'on_track';

            // Validate required fields (with better error logging)
            if (!borrower || !amount || isNaN(amount) || !interestRate || isNaN(interestRate) || !term || isNaN(term) || !startDate) {
              console.warn(`Row ${index + 2} is missing required fields, skipping`, {
                borrower,
                amount,
                interestRate,
                term,
                startDate,
                availableColumns: allColumns,
                rowData: row
              });
              return null;
            }

            // Generate unique ID using timestamp, row index, and random component
            const uniqueId = loanData.id || `loan-import-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            
            return {
              id: uniqueId,
              borrower,
              amount,
              interestRate,
              term,
              startDate: formatDateString(startDate),
              endDate: endDate ? formatDateString(endDate) : calculateEndDate(formatDateString(startDate), term),
              status,
              borrowerEmail,
              borrowerPhone,
              loanOfficer,
              obligations: [],
              notes: [],
              tags: [],
              communications: [],
              paymentSchedule: generatePaymentSchedule({
                id: uniqueId,
                amount,
                interestRate,
                term,
                startDate: formatDateString(startDate)
              })
            };
          }).filter(loan => loan !== null);

          console.log(`Successfully parsed ${loans.length} loans from ${jsonData.length} rows`);
          if (loans.length > 0) {
            console.log('Sample of parsed loans:', loans.slice(0, 3).map(l => ({
              id: l.id,
              borrower: l.borrower,
              amount: l.amount,
              startDate: l.startDate
            })));
          }

          if (loans.length === 0 && jsonData.length > 0) {
            // Provide helpful error message about what columns were found
            const foundColumns = allColumns.join(', ');
            reject(new Error(
              `No valid loans found in Excel file. All rows were skipped due to missing required fields.\n\n` +
              `Found columns: ${foundColumns}\n\n` +
              `Required columns: borrower/name, amount/principal, interestRate/apr, term/months, startDate/date\n\n` +
              `Please ensure your Excel file has data in these columns and that the values are valid (non-zero numbers for amount, interest rate, and term).`
            ));
            return;
          }

          resolve(loans);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  } else {
    // Fallback: Try to read as CSV if SheetJS is not available
    throw new Error('Excel parsing requires SheetJS library. Please install xlsx: npm install xlsx');
  }
};

/**
 * Import loans from CSV or Excel file
 */
export const importLoansFromFile = async (file, userIdentifier) => {
  if (!userIdentifier) {
    throw new Error('User identifier required to import loans');
  }

  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  let loans = [];

  if (fileExtension === 'csv') {
    // Parse CSV
    const text = await readFileAsText(file);
    loans = parseCSV(text);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    // Parse Excel
    loans = await parseExcel(file);
  } else {
    throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: CSV, XLSX`);
  }

  if (loans.length === 0) {
    throw new Error(
      'No valid loans found in file. Please ensure your file contains:\n' +
      '- A header row with column names\n' +
      '- At least one data row with: borrower/name, amount, interest rate, term (months), and start date\n' +
      '- Valid numeric values (amount > 0, interest rate > 0, term > 0)'
    );
  }

  // Enrich loans and associate with user
  const enrichedLoans = loans.map(loan => {
    const enriched = enrichLoan(loan);
    return {
      ...enriched,
      managedBy: userIdentifier, // Required for filtering on dashboard
      userId: userIdentifier,
      userEmail: userIdentifier,
      borrowerIdentifier: enriched.borrowerEmail?.toLowerCase().trim() || 
                         enriched.borrower?.toLowerCase().trim() || null
    };
  });

  // Save to localStorage
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

  // Merge with existing loans (avoid duplicates by ID and by borrower+amount+startDate)
  const existingIds = new Set(existingLoans.map(l => l.id));
  
  // Create a set of unique identifiers for existing loans (borrower + amount + startDate)
  const existingLoanKeys = new Set(
    existingLoans.map(l => 
      `${l.borrower?.toLowerCase().trim() || ''}_${l.amount}_${l.startDate}`
    )
  );
  
  // Filter out duplicates by both ID and loan key
  const newLoans = enrichedLoans.filter(l => {
    const isDuplicateId = existingIds.has(l.id);
    const loanKey = `${l.borrower?.toLowerCase().trim() || ''}_${l.amount}_${l.startDate}`;
    const isDuplicateLoan = existingLoanKeys.has(loanKey);
    
    if (isDuplicateId || isDuplicateLoan) {
      console.log('Skipping duplicate loan:', {
        id: l.id,
        borrower: l.borrower,
        amount: l.amount,
        startDate: l.startDate,
        reason: isDuplicateId ? 'duplicate ID' : 'duplicate loan data'
      });
      return false;
    }
    
    // Add to existing keys to prevent duplicates within the same import batch
    existingLoanKeys.add(loanKey);
    return true;
  });
  
  const updatedLoans = [...existingLoans, ...newLoans];
  
  console.log(`Import summary: ${enrichedLoans.length} loans parsed, ${newLoans.length} new loans added, ${enrichedLoans.length - newLoans.length} duplicates skipped`);

  const updatedState = {
    state: {
      loans: updatedLoans,
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
      currentUserId: userIdentifier
    },
    version: 0
  };

  if (currentStorage) {
    try {
      const parsed = JSON.parse(currentStorage);
      updatedState.state = {
        ...parsed.state,
        loans: updatedLoans,
        alerts: []
      };
    } catch (error) {
      // Use new state if parsing fails
    }
  }

  localStorage.setItem(storageKey, JSON.stringify(updatedState));

  // Update the Zustand store directly so UI updates immediately
  useLoanStore.setState({ loans: updatedLoans });
  
  // Regenerate alerts for all loans
  useLoanStore.getState().generateAlerts();

  return {
    imported: newLoans.length,
    total: updatedLoans.length,
    skipped: enrichedLoans.length - newLoans.length
  };
};

/**
 * Helper function to read file as text
 */
export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Helper function to format date string
 */
const formatDateString = (dateString) => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Try to parse various date formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Try common formats
  const parts = dateString.split(/[-\/]/);
  if (parts.length === 3) {
    // Try MM/DD/YYYY or DD/MM/YYYY
    let year, month, day;
    if (parts[2].length === 4) {
      // Assume MM/DD/YYYY format
      year = parts[2];
      month = parts[0].padStart(2, '0');
      day = parts[1].padStart(2, '0');
    } else {
      // Assume DD/MM/YYYY format
      year = `20${parts[2]}`;
      month = parts[1].padStart(2, '0');
      day = parts[0].padStart(2, '0');
    }
    return `${year}-${month}-${day}`;
  }
  
  return new Date().toISOString().split('T')[0];
};

/**
 * Helper function to calculate end date from start date and term
 */
const calculateEndDate = (startDate, termMonths) => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + termMonths);
  return end.toISOString().split('T')[0];
};

