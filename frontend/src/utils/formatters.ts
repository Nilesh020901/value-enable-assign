/**
 * Formats a number to Indian currency format (en-IN, ₹)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
  return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Formats a decimal number into percentage (e.g. 0.08415 -> 8.42%)
 */
export function formatPercent(rate: number, decimals: number = 2): string {
  if (isNaN(rate) || rate === null || rate === undefined) {
    return '0.00%';
  }
  return `${(rate * 100).toFixed(decimals)}%`;
}

export function calculateAgeLive(dobString: string): number | null {
  if (!dobString) return null;
  const parts = dobString.trim().split('-');
  let birthYear: number, birthMonth: number, birthDay: number;

  if (parts.length === 3) {
    birthYear = parseInt(parts[0], 10);
    birthMonth = parseInt(parts[1], 10) - 1;
    birthDay = parseInt(parts[2], 10);
  } else {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    birthYear = dob.getFullYear();
    birthMonth = dob.getMonth();
    birthDay = dob.getDate();
  }

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age >= 0 ? age : null;
}
