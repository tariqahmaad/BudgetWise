/**
 * Professional number formatting utility for displaying monetary amounts
 * Automatically converts large numbers to compact format (K, M, B)
 * 
 * @param {number|string} amount - The amount to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showCents - Whether to show cents for smaller amounts (default: true)
 * @param {boolean} options.useCompactFormat - Whether to use compact format for large amounts (default: true)
 * @param {string} options.currency - Currency symbol to display (default: '$') - DEPRECATED: Use currency context instead
 * @param {number} options.compactThreshold - Minimum amount to trigger compact format (default: 100000)
 * @returns {string} Formatted amount string
 * 
 * @example
 * formatAmount(1234.56) // "$1,234.56"
 * formatAmount(123456) // "$123.5K"
 * formatAmount(1234567) // "$1.2M"
 * formatAmount(1234567890) // "$1.2B"
 * formatAmount(25000, { showCents: false }) // "$25K"
 * 
 * @deprecated This function is maintained for backward compatibility.
 * For new code, use the currency context: useCurrency().formatAmount()
 */
export const formatAmount = (amount, options = {}) => {
    const {
        showCents = true,
        useCompactFormat = true,
        currency = '$', // Kept for backward compatibility
        compactThreshold = 100000 // 100K threshold
    } = options;

    const numAmount = parseFloat(amount) || 0;
    const absAmount = Math.abs(numAmount);

    // Use compact format for amounts >= 100K
    const shouldUseCompact = useCompactFormat && absAmount >= compactThreshold;

    if (shouldUseCompact) {
        if (absAmount >= 1000000000) {
            // Billions: 1,000,000,000+
            const billions = numAmount / 1000000000;
            const formatted = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
            return `${currency}${formatted}B`;
        } else if (absAmount >= 1000000) {
            // Millions: 1,000,000 - 999,999,999
            const millions = numAmount / 1000000;
            const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
            return `${currency}${formatted}M`;
        } else if (absAmount >= 1000) {
            // Thousands: 1,000 - 999,999
            const thousands = numAmount / 1000;
            const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
            return `${currency}${formatted}K`;
        }
    }

    // Standard format for smaller amounts or when compact is disabled
    if (showCents) {
        return `${currency}${numAmount.toFixed(2)}`;
    } else {
        return `${currency}${Math.round(numAmount).toLocaleString()}`;
    }
};

export default formatAmount; 