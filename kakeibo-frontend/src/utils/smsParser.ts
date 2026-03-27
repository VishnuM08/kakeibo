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
  id?: string;
  merchant: string;
  amount: number;
  date: Date;
  category: string;
  rawHash: string;
  transactionType?: 'debit' | 'credit';
  type?: 'debit' | 'credit';
  bank?: string;
  isApproved?: boolean;
  isRejected?: boolean;
  isProcessed?: boolean;
  fullMessage?: string;
}

/**
 * Robust Transaction Parser for Indian Banks
 * Supports formats for HDFC, SBI, ICICI, Axis, PNB, etc.
 */
export const parseTransactionSMS = (message: string): ParsedTransaction | null => {
  if (!message || message.length < 10) return null;

  // 1. AMOUNT EXTRACTION
  // Matches: Rs. 500, Rs 500, INR 500, ₹ 500, 500.00, etc.
  const amountRegex = /(?:Rs\.?|INR|₹|Amt|Amount)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const amountMatch = message.match(amountRegex);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

  // 2. TRANSACTION TYPE (Debit vs Credit)
  let type: 'debit' | 'credit' = 'debit'; // Default to debit (safer for expense tracker)
  if (/\b(credited|received|deposited|added|inbound|refunded|reversal|linked)\b/i.test(message)) {
    type = 'credit';
  } else if (/\b(debited|deducted|spent|withdrawn|paid|outbound|txn|tran|purchase)\b/i.test(message)) {
    type = 'debit';
  }

  // 3. MERCHANT EXTRACTION
  // Look for "at", "to", "on", "from", or "via" following the transaction keywords
  let merchant = "Unknown";
  
  // Specific patterns for common bank formats
  const merchantPatterns = [
    /(?:at|to|on|from|via|info:)\s*([A-Z0-9\s&*'.@]+?)(?:\s+on|\s+at|\s+using|\s+via|\s+avl|\s+bal|\s+Ref|\.?$)/i,
    /VPA\s+([A-Z0-9\s&*'.@]+?)(?:\s+on|\s+at|\s*)/i, // UPI format
    /info:\s*([A-Z0-9\s&*'.]+?)(?:\s*on|\.?$)/i, // SBI format often uses info:
  ];

  for (const pattern of merchantPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate && !/^(Rs|INR|Amt|Account|A\/c|is|our)/i.test(candidate)) {
        merchant = candidate;
        break;
      }
    }
  }

  // 4. BANK DETECTION (Optional but nice)
  let bank = "Bank Transaction";
  if (/\b(HDFC|SBI|ICICI|AXIS|BOB|PNB|UNION|CANARA|KOTAK|YES|IDBI)\b/i.test(message)) {
    const bankMatch = message.match(/\b(HDFC|SBI|ICICI|AXIS|BOB|PNB|UNION|CANARA|KOTAK|YES|IDBI)\b/i);
    if (bankMatch) bank = bankMatch[0].toUpperCase();
  } else if (/\b(UPI|PAYTM|GPAY|PHONEPE)\b/i.test(message)) {
    bank = "UPI / App";
  }

  const hash = generateSMSHash(message);

  return {
    id: hash,
    amount,
    merchant,
    date: new Date(),
    category: "other", // Default category
    rawHash: hash,
    transactionType: type,
    type: type, // Support both naming conventions
    bank,
    fullMessage: message
  };
};

/**
 * Categorize transaction based on merchant keywords
 */
export const categorizeTransaction = (merchant: string): string => {
  const m = merchant.toLowerCase();
  if (/\b(swiggy|zomato|ubereats|kfc|mcdonald|food|restaurant|cafe|coffee|starbucks|chai)\b/.test(m)) return "food";
  if (/\b(uber|ola|rapido|metro|irctc|train|bus|fuel|petrol|shell|hpcl|bpcl)\b/.test(m)) return "transport";
  if (/\b(amazon|flipkart|myntra|ajio|zara|h&m|mall|retail|shopping)\b/.test(m)) return "shopping";
  if (/\b(netflix|prime|hotstar|pvr|inox|cinema|theatre|spotify|gaming|steam)\b/.test(m)) return "entertainment";
  if (/\b(airtel|jio|vi|electricity|bescom|water|gas|recharge|bill)\b/.test(m)) return "utilities";
  return "other";
};
