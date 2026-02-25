export function extractAmountFromSms(text: string): number | null {
  if (!text) return null;

  /**
   * Matches:
   * Rs.550
   * Rs 550
   * INR 550
   * ₹550
   * ₹ 550.75
   */
  const regex = /(rs\.?|inr|₹)\s?([\d,]+(\.\d{1,2})?)/i;

  const match = text.match(regex);

  if (!match) return null;

  // Remove commas and parse
  const amount = parseFloat(match[2].replace(/,/g, ""));
  return isNaN(amount) ? null : amount;
}
