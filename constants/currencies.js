/**
 * Currency configuration for BudgetWise application
 * Contains popular currencies with their symbols, names, and countries
 */

export const CURRENCIES = [
    {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        country: 'United States',
        flag: '🇺🇸',
        position: 'before', // Symbol position: 'before' or 'after'
    },
    {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        country: 'European Union',
        flag: '🇪🇺',
        position: 'before',
    },
    {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        country: 'United Kingdom',
        flag: '🇬🇧',
        position: 'before',
    },
    {
        code: 'JPY',
        symbol: '¥',
        name: 'Japanese Yen',
        country: 'Japan',
        flag: '🇯🇵',
        position: 'before',
    },
    {
        code: 'TRY',
        symbol: '₺',
        name: 'Turkish Lira',
        country: 'Turkey',
        flag: '🇹🇷',
        position: 'before',
    },
    {
        code: 'CAD',
        symbol: 'C$',
        name: 'Canadian Dollar',
        country: 'Canada',
        flag: '🇨🇦',
        position: 'before',
    },
    {
        code: 'AUD',
        symbol: 'A$',
        name: 'Australian Dollar',
        country: 'Australia',
        flag: '🇦🇺',
        position: 'before',
    },
    {
        code: 'CHF',
        symbol: 'CHF',
        name: 'Swiss Franc',
        country: 'Switzerland',
        flag: '🇨🇭',
        position: 'before',
    },
    {
        code: 'CNY',
        symbol: '¥',
        name: 'Chinese Yuan',
        country: 'China',
        flag: '🇨🇳',
        position: 'before',
    },
    {
        code: 'INR',
        symbol: '₹',
        name: 'Indian Rupee',
        country: 'India',
        flag: '🇮🇳',
        position: 'before',
    },
];

// Default currency (currently USD)
export const DEFAULT_CURRENCY = CURRENCIES[0];

// Helper function to get currency by code
export const getCurrencyByCode = (code) => {
    return CURRENCIES.find(currency => currency.code === code) || DEFAULT_CURRENCY;
};

// Helper function to format amount with currency
export const formatWithCurrency = (amount, currencyCode = 'USD', options = {}) => {
    const currency = getCurrencyByCode(currencyCode);
    const {
        showCents = true,
        useCompactFormat = true,
        compactThreshold = 100000
    } = options;

    const numAmount = parseFloat(amount) || 0;
    const absAmount = Math.abs(numAmount);

    // Use compact format for amounts >= 100K
    const shouldUseCompact = useCompactFormat && absAmount >= compactThreshold;

    let formattedNumber = '';

    if (shouldUseCompact) {
        if (absAmount >= 1000000000) {
            // Billions: 1,000,000,000+
            const billions = numAmount / 1000000000;
            formattedNumber = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
            formattedNumber += 'B';
        } else if (absAmount >= 1000000) {
            // Millions: 1,000,000 - 999,999,999
            const millions = numAmount / 1000000;
            formattedNumber = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
            formattedNumber += 'M';
        } else if (absAmount >= 1000) {
            // Thousands: 1,000 - 999,999
            const thousands = numAmount / 1000;
            formattedNumber = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
            formattedNumber += 'K';
        } else {
            formattedNumber = showCents ? numAmount.toFixed(2) : Math.round(numAmount).toLocaleString();
        }
    } else {
        // Standard format for smaller amounts or when compact is disabled
        formattedNumber = showCents ? numAmount.toFixed(2) : Math.round(numAmount).toLocaleString();
    }

    // Apply currency symbol based on position
    if (currency.position === 'after') {
        return `${formattedNumber}${currency.symbol}`;
    } else {
        return `${currency.symbol}${formattedNumber}`;
    }
};

// Storage key for currency preference
export const CURRENCY_STORAGE_KEY = '@budgetwise_currency_preference'; 