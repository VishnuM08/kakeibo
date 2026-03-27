// DJB2 Hashing for duplicate detection
export const generateSMSHash = (msg: string): string => {
  let hash = 5381;
  for (let i = 0; i < msg.length; i++) {
    hash = ((hash << 5) + hash) + msg.charCodeAt(i);
  }
  return hash.toString(16);
};

// Main Parsing Logic
export interface ParsedTransaction {
  id?: string; // For compatibility with SMSTransactionsView
  merchant: string;
  amount: number;
  date: Date;
  category: string;
  rawHash: string; // Critical for persistence
  transactionType?: 'debit' | 'credit'; // For SMSTransactionsView
  type?: 'debit' | 'credit'; // For compatibility with DetectedTransactions.tsx
  bank?: string; // For SMSTransactionsView
  isApproved?: boolean;
  isRejected?: boolean;
  isProcessed?: boolean; // For compatibility with AppMain badge logic
  fullMessage?: string; // For compatibility
}

export const parseTransactionSMS = (message: string): ParsedTransaction | null => {
  // Regex for common Indian banking/app transaction SMS
  const amountMatch = message.match(/(?:Rs\.?|INR|₹)\s?(\d+(?:\.\d{1,2})?)/i);
  const merchantMatch = message.match(/(?:at|to|on)\s+([A-Z0-9\s&*]+?)(?:\s+on|\s+at|\s+using|$)/i);
  
  if (!amountMatch) return null;
  
  const amount = parseFloat(amountMatch[1]);
  const merchant = merchantMatch ? merchantMatch[1].trim() : "Unknown Merchant";
  const hash = generateSMSHash(message);

  return {
    id: hash,
    amount: amount,
    merchant: merchant,
    date: new Date(),
    category: "other",
    rawHash: hash,
    transactionType: 'debit',
    type: 'debit', // Compatibility for DetectedTransactions.tsx
    bank: "Bank Alert"
  };
};

// Mock data for testing/initial load as requested in instructions
export const getMockSMSTransactions = (): ParsedTransaction[] => {
  const mockMessages = [
    "Rs. 450.00 debited at STARBUCKS on 2026-03-25. Avl Bal Rs. 12450.00",
    "INR 1,200.00 spent on Card at AMAZON PAY on 2026-03-24",
    "Txn of ₹85.00 at CHAI POINT using UPI on 25-03-26"
  ];

  return mockMessages.map(msg => parseTransactionSMS(msg)).filter(t => t !== null) as ParsedTransaction[];
};
