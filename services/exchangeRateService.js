import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXCHANGE_RATE_API_KEY } from '@env';
import APIKeyService from './apiKeyService';

class ExchangeRateService {
    constructor() {
        this.apiKey = null; // Will be dynamically resolved
        this.baseURL = 'https://v6.exchangerate-api.com/v6';
        this.cacheKeyPrefix = '@budgetwise_exchange_rates_';
        this.currenciesCache = '@budgetwise_all_currencies';
        this.cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours
        this.currencyCacheExpiry = 24 * 60 * 60 * 1000; // 24 hours for currency list
        this.fallbackRates = {
            USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, TRY: 27,
            CAD: 1.25, AUD: 1.35, CHF: 0.92, CNY: 6.4, INR: 74
        };
    }

    // Get API key dynamically (user-configured or environment fallback)
    async getAPIKey() {
        try {
            const userApiKey = await APIKeyService.getAPIKey('exchangeRate');
            const apiKey = userApiKey || EXCHANGE_RATE_API_KEY;

            if (!apiKey) {
                throw new Error('No Exchange Rate API key available. Please configure your API key in Settings > Security & Privacy > API Configuration.');
            }

            return apiKey;
        } catch (error) {
            console.error('[ExchangeRateService] Failed to get API key:', error);
            throw error;
        }
    }

    async getCachedRates(baseCurrency) {
        try {
            const cacheKey = `${this.cacheKeyPrefix}${baseCurrency}`;
            const cached = await AsyncStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Error getting cached rates:', error);
            return null;
        }
    }

    async cacheRates(baseCurrency, rates) {
        try {
            const cacheKey = `${this.cacheKeyPrefix}${baseCurrency}`;
            const cacheData = {
                rates,
                timestamp: Date.now(),
                baseCurrency
            };
            await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching rates:', error);
        }
    }

    isCacheExpired(timestamp) {
        return Date.now() - timestamp > this.cacheExpiry;
    }

    getFallbackRates() {
        return this.fallbackRates;
    }

    async getExchangeRates(baseCurrency = 'USD') {
        // Validate currency code
        if (!baseCurrency || typeof baseCurrency !== 'string' || baseCurrency.length !== 3) {
            throw new Error('Invalid currency code');
        }

        const currencyCode = baseCurrency.toUpperCase();
        const apiKey = await this.getAPIKey();
        console.log(`[ExchangeRateService] Fetching rates for ${currencyCode} using API key: ${apiKey?.substring(0, 8)}...`);

        // Check cache first
        const cached = await this.getCachedRates(currencyCode);
        if (cached && !this.isCacheExpired(cached.timestamp)) {
            console.log(`[ExchangeRateService] Using cached rates for ${currencyCode}`);
            return { rates: cached.rates, fromCache: true };
        }

        // Fetch fresh rates with timeout
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const apiUrl = `${this.baseURL}/${apiKey}/latest/${currencyCode}`;

            console.log(`[ExchangeRateService] Making API request to: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            console.log(`[ExchangeRateService] API Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ExchangeRateService] API Error: ${response.status} - ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[ExchangeRateService] API Response:`, {
                result: data.result,
                base_code: data.base_code,
                time_last_update_utc: data.time_last_update_utc,
                rates_count: data.conversion_rates ? Object.keys(data.conversion_rates).length : 0
            });

            // Validate response data for new API format
            if (data.result !== 'success' || !data.conversion_rates || typeof data.conversion_rates !== 'object') {
                console.error('[ExchangeRateService] Invalid response format:', data);
                throw new Error('Invalid response format');
            }

            // Cache the results
            await this.cacheRates(currencyCode, data.conversion_rates);
            console.log(`[ExchangeRateService] Successfully cached ${Object.keys(data.conversion_rates).length} rates for ${currencyCode}`);
            return { rates: data.conversion_rates, fromCache: false };
        } catch (error) {
            console.error('[ExchangeRateService] Error fetching exchange rates:', error);

            // Fallback to cached data if available
            if (cached) {
                console.log('[ExchangeRateService] Using stale cached data');
                return { rates: cached.rates, fromCache: true, isStale: true };
            }

            // Last resort: use fallback rates
            console.log('[ExchangeRateService] Using fallback rates');
            return { rates: this.getFallbackRates(), fromCache: false, isFallback: true };
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        // Validate inputs
        if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
            throw new Error('Invalid amount');
        }

        if (!fromCurrency || !toCurrency) {
            throw new Error('Currency codes are required');
        }

        const from = fromCurrency.toUpperCase();
        const to = toCurrency.toUpperCase();

        console.log(`[ExchangeRateService] Converting ${amount} ${from} to ${to}`);

        if (from === to) {
            console.log('[ExchangeRateService] Same currency, returning original amount');
            return amount;
        }

        try {
            const { rates, fromCache, isFallback } = await this.getExchangeRates(from);
            const rate = rates[to];

            console.log(`[ExchangeRateService] Exchange rate ${from} -> ${to}: ${rate} (fromCache: ${fromCache}, isFallback: ${isFallback})`);

            if (!rate || typeof rate !== 'number' || rate <= 0) {
                console.error(`[ExchangeRateService] Invalid rate for ${to}:`, rate);
                throw new Error(`Conversion rate not available for ${to}`);
            }

            const converted = amount * rate;
            console.log(`[ExchangeRateService] Conversion result: ${amount} × ${rate} = ${converted}`);

            // Validate result
            if (isNaN(converted) || !isFinite(converted)) {
                throw new Error('Invalid conversion result');
            }

            return converted;
        } catch (error) {
            console.error('[ExchangeRateService] Error converting currency:', error);
            throw error;
        }
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return 1;

        try {
            const { rates } = await this.getExchangeRates(fromCurrency);
            return rates[toCurrency] || 1;
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            return 1;
        }
    }

    async getCachedCurrencies() {
        try {
            const cached = await AsyncStorage.getItem(this.currenciesCache);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            console.error('Error getting cached currencies:', error);
            return null;
        }
    }

    async cacheCurrencies(currencies) {
        try {
            const cacheData = {
                currencies,
                timestamp: Date.now()
            };
            await AsyncStorage.setItem(this.currenciesCache, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching currencies:', error);
        }
    }

    isCurrencyCacheExpired(timestamp) {
        return Date.now() - timestamp > this.currencyCacheExpiry;
    }

    getDefaultCurrencies() {
        // Fallback currencies with their names
        return [
            { code: 'USD', name: 'US Dollar' },
            { code: 'EUR', name: 'Euro' },
            { code: 'GBP', name: 'British Pound' },
            { code: 'JPY', name: 'Japanese Yen' },
            { code: 'TRY', name: 'Turkish Lira' },
            { code: 'CAD', name: 'Canadian Dollar' },
            { code: 'AUD', name: 'Australian Dollar' },
            { code: 'CHF', name: 'Swiss Franc' },
            { code: 'CNY', name: 'Chinese Yuan' },
            { code: 'INR', name: 'Indian Rupee' },
            { code: 'RUB', name: 'Russian Ruble' },
            { code: 'BRL', name: 'Brazilian Real' },
            { code: 'KRW', name: 'South Korean Won' },
            { code: 'MXN', name: 'Mexican Peso' },
            { code: 'SGD', name: 'Singapore Dollar' },
            { code: 'NZD', name: 'New Zealand Dollar' },
            { code: 'NOK', name: 'Norwegian Krone' },
            { code: 'SEK', name: 'Swedish Krona' },
            { code: 'DKK', name: 'Danish Krone' },
            { code: 'PLN', name: 'Polish Zloty' }
        ];
    }

    async getAllCurrencies() {
        console.log('[ExchangeRateService] Fetching all currencies...');

        // Check cache first
        const cached = await this.getCachedCurrencies();
        if (cached && !this.isCurrencyCacheExpired(cached.timestamp)) {
            console.log(`[ExchangeRateService] Using cached currencies (${cached.currencies.length} currencies)`);
            return { currencies: cached.currencies, fromCache: true };
        }

        // Fetch fresh currencies with timeout
        try {
            const apiKey = await this.getAPIKey();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const apiUrl = `${this.baseURL}/${apiKey}/codes`;

            console.log(`[ExchangeRateService] Making API request to: ${apiUrl}`);

            const response = await fetch(apiUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            console.log(`[ExchangeRateService] Currencies API Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[ExchangeRateService] Currencies API Error: ${response.status} - ${errorText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[ExchangeRateService] Currencies API Response:`, {
                result: data.result,
                supported_codes_count: data.supported_codes ? data.supported_codes.length : 0
            });

            // Validate response data
            if (data.result !== 'success' || !Array.isArray(data.supported_codes)) {
                console.error('[ExchangeRateService] Invalid currencies response format:', data);
                throw new Error('Invalid currencies response format');
            }

            // Transform the response into our format
            const currencies = data.supported_codes.map(([code, name]) => ({
                code,
                name
            }));

            console.log(`[ExchangeRateService] Successfully fetched ${currencies.length} currencies`);

            // Cache the results
            await this.cacheCurrencies(currencies);
            return { currencies, fromCache: false };
        } catch (error) {
            console.error('[ExchangeRateService] Error fetching currencies:', error);

            // Fallback to cached data if available
            if (cached) {
                console.log('[ExchangeRateService] Using stale cached currencies');
                return { currencies: cached.currencies, fromCache: true, isStale: true };
            }

            // Last resort: use default currencies
            console.log('[ExchangeRateService] Using default currencies');
            return { currencies: this.getDefaultCurrencies(), fromCache: false, isFallback: true };
        }
    }

    async clearCache() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(key =>
                key.startsWith(this.cacheKeyPrefix) || key === this.currenciesCache
            );
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

export default new ExchangeRateService(); 