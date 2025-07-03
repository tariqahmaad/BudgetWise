/**
 * Currency configuration for BudgetWise application
 * Contains popular currencies with their symbols, names, and countries
 */

// Comprehensive currency flag mapping for all supported currencies
const CURRENCY_FLAGS = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', TRY: '🇹🇷',
    CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳',
    RUB: '🇷🇺', BRL: '🇧🇷', KRW: '🇰🇷', MXN: '🇲🇽', SGD: '🇸🇬',
    NZD: '🇳🇿', NOK: '🇳🇴', SEK: '🇸🇪', DKK: '🇩🇰', PLN: '🇵🇱',
    HKD: '🇭🇰', THB: '🇹🇭', MYR: '🇲🇾', ZAR: '🇿🇦', EGP: '🇪🇬',
    NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', UAH: '🇺🇦', CZK: '🇨🇿',
    HUF: '🇭🇺', RON: '🇷🇴', BGN: '🇧🇬', HRK: '🇭🇷', ISK: '🇮🇸',
    ILS: '🇮🇱', SAR: '🇸🇦', AED: '🇦🇪', QAR: '🇶🇦', KWD: '🇰🇼',
    BHD: '🇧🇭', OMR: '🇴🇲', JOD: '🇯🇴', LBP: '🇱🇧', PKR: '🇵🇰',
    BDT: '🇧🇩', LKR: '🇱🇰', NPR: '🇳🇵', MMK: '🇲🇲', VND: '🇻🇳',
    IDR: '🇮🇩', PHP: '🇵🇭', TWD: '🇹🇼', KHR: '🇰🇭', LAK: '🇱🇦',
    AMD: '🇦🇲', AZN: '🇦🇿', GEL: '🇬🇪', KZT: '🇰🇿', UZS: '🇺🇿',
    KGS: '🇰🇬', TJS: '🇹🇯', TMT: '🇹🇲', AFN: '🇦🇫', IRR: '🇮🇷',
    IQD: '🇮🇶', SYP: '🇸🇾', YER: '🇾🇪', ETB: '🇪🇹', DJF: '🇩🇯',
    SOS: '🇸🇴', UGX: '🇺🇬', TZS: '🇹🇿', RWF: '🇷🇼', BIF: '🇧🇮',
    MGA: '🇲🇬', MUR: '🇲🇺', SCR: '🇸🇨', CVE: '🇨🇻', GMD: '🇬🇲',
    SLE: '🇸🇱', LRD: '🇱🇷', CIV: '🇨🇮', BFA: '🇧🇫', MLI: '🇲🇱',
    NER: '🇳🇪', TCD: '🇹🇩', CMR: '🇨🇲', CAF: '🇨🇫', COG: '🇨🇬',
    COD: '🇨🇩', GAB: '🇬🇦', GNQ: '🇬🇶', ANG: '🇳🇱', AWG: '🇦🇼',
    BBD: '🇧🇧', BZD: '🇧🇿', BMD: '🇧🇲', BOB: '🇧🇴', BSD: '🇧🇸',
    CLP: '🇨🇱', COP: '🇨🇴', CRC: '🇨🇷', CUP: '🇨🇺', DOP: '🇩🇴',
    XCD: '🇦🇬', FJD: '🇫🇯', GTQ: '🇬🇹', GYD: '🇬🇾', HTG: '🇭🇹',
    HNL: '🇭🇳', JMD: '🇯🇲', NIO: '🇳🇮', PAB: '🇵🇦', PEN: '🇵🇪',
    PYG: '🇵🇾', SRD: '🇸🇷', TTD: '🇹🇹', UYU: '🇺🇾', VES: '🇻🇪',
    // Additional popular currencies
    ALL: '🇦🇱', DZD: '🇩🇿', AOA: '🇦🇴', ARS: '🇦🇷', AWG: '🇦🇼',
    AZN: '🇦🇿', BAM: '🇧🇦', BBD: '🇧🇧', BDT: '🇧🇩', BGN: '🇧🇬',
    BHD: '🇧🇭', BIF: '🇧🇮', BMD: '🇧🇲', BND: '🇧🇳', BOB: '🇧🇴',
    BOV: '🇧🇴', BRL: '🇧🇷', BSD: '🇧🇸', BTN: '🇧🇹', BWP: '🇧🇼',
    BYN: '🇧🇾', BZD: '🇧🇿', CDF: '🇨🇩', CLF: '🇨🇱', CLP: '🇨🇱',
    COP: '🇨🇴', COU: '🇨🇴', CRC: '🇨🇷', CUC: '🇨🇺', CUP: '🇨🇺',
    CVE: '🇨🇻', CZK: '🇨🇿', DJF: '🇩🇯', DKK: '🇩🇰', DOP: '🇩🇴',
    DZD: '🇩🇿', EGP: '🇪🇬', ERN: '🇪🇷', ETB: '🇪🇹', FJD: '🇫🇯',
    FKP: '🇫🇰', GEL: '🇬🇪', GGP: '🇬🇬', GHS: '🇬🇭', GIP: '🇬🇮',
    GMD: '🇬🇲', GNF: '🇬🇳', GTQ: '🇬🇹', GYD: '🇬🇾', HNL: '🇭🇳',
    HRK: '🇭🇷', HTG: '🇭🇹', HUF: '🇭🇺', IDR: '🇮🇩', ILS: '🇮🇱',
    IMP: '🇮🇲', INR: '🇮🇳', IQD: '🇮🇶', IRR: '🇮🇷', ISK: '🇮🇸',
    JEP: '🇯🇪', JMD: '🇯🇲', JOD: '🇯🇴', KES: '🇰🇪', KGS: '🇰🇬',
    KHR: '🇰🇭', KMF: '🇰🇲', KPW: '🇰🇵', KRW: '🇰🇷', KWD: '🇰🇼',
    KYD: '🇰🇾', KZT: '🇰🇿', LAK: '🇱🇦', LBP: '🇱🇧', LKR: '🇱🇰',
    LRD: '🇱🇷', LSL: '🇱🇸', LYD: '🇱🇾', MAD: '🇲🇦', MDL: '🇲🇩',
    MGA: '🇲🇬', MKD: '🇲🇰', MMK: '🇲🇲', MNT: '🇲🇳', MOP: '🇲🇴',
    MRU: '🇲🇷', MUR: '🇲🇺', MVR: '🇲🇻', MWK: '🇲🇼', MXN: '🇲🇽',
    MYR: '🇲🇾', MZN: '🇲🇿', NAD: '🇳🇦', NGN: '🇳🇬', NIO: '🇳🇮',
    NOK: '🇳🇴', NPR: '🇳🇵', NZD: '🇳🇿', OMR: '🇴🇲', PAB: '🇵🇦',
    PEN: '🇵🇪', PGK: '🇵🇬', PHP: '🇵🇭', PKR: '🇵🇰', PLN: '🇵🇱',
    PYG: '🇵🇾', QAR: '🇶🇦', RON: '🇷🇴', RSD: '🇷🇸', RUB: '🇷🇺',
    RWF: '🇷🇼', SAR: '🇸🇦', SBD: '🇸🇧', SCR: '🇸🇨', SDG: '🇸🇩',
    SEK: '🇸🇪', SGD: '🇸🇬', SHP: '🇸🇭', SLE: '🇸🇱', SLL: '🇸🇱',
    SOS: '🇸🇴', SRD: '🇸🇷', STN: '🇸🇹', SVC: '🇸🇻', SYP: '🇸🇾',
    SZL: '🇸🇿', THB: '🇹🇭', TJS: '🇹🇯', TMT: '🇹🇲', TND: '🇹🇳',
    TOP: '🇹🇴', TRY: '🇹🇷', TTD: '🇹🇹', TVD: '🇹🇻', TWD: '🇹🇼',
    TZS: '🇹🇿', UAH: '🇺🇦', UGX: '🇺🇬', USD: '🇺🇸', UYU: '🇺🇾',
    UYW: '🇺🇾', UZS: '🇺🇿', VED: '🇻🇪', VES: '🇻🇪', VND: '🇻🇳',
    VUV: '🇻🇺', WST: '🇼🇸', XAF: '🇨🇲', XCD: '🇦🇬', XDR: '🌍',
    XOF: '🇸🇳', XPF: '🇵🇫', YER: '🇾🇪', ZAR: '🇿🇦', ZMW: '🇿🇲',
    ZWL: '🇿🇼',
};

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

// Helper function to get currency by code with comprehensive flag support
export const getCurrencyByCode = (code) => {
    // First try to find in the predefined CURRENCIES array
    const predefinedCurrency = CURRENCIES.find(currency => currency.code === code);

    if (predefinedCurrency) {
        return predefinedCurrency;
    }

    // If not found, create a minimal currency object with flag from comprehensive mapping
    const flag = CURRENCY_FLAGS[code] || '💱'; // Default generic currency symbol

    return {
        code: code,
        symbol: code, // Use code as symbol for unknown currencies
        name: code, // Use code as name for unknown currencies
        country: 'Unknown',
        flag: flag,
        position: 'before',
    };
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