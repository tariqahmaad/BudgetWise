import React, { createContext, useContext, useState, useEffect } from 'react';
import exchangeRateService from '../services/exchangeRateService';

// Create the context
const ExchangeRateContext = createContext();

// Hook to use the exchange rate context
export const useExchangeRate = () => {
    const context = useContext(ExchangeRateContext);
    if (!context) {
        throw new Error('useExchangeRate must be used within an ExchangeRateProvider');
    }
    return context;
};

// Exchange Rate Provider Component
export const ExchangeRateProvider = ({ children }) => {
    const [exchangeRates, setExchangeRates] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);
    const [currencies, setCurrencies] = useState([]);
    const [currenciesLoading, setCurrenciesLoading] = useState(false);

    // Convert amount from one currency to another
    const convertAmount = async (amount, fromCurrency, toCurrency) => {
        if (!amount || amount === 0) return 0;

        setError(null);
        try {
            const converted = await exchangeRateService.convertCurrency(
                parseFloat(amount),
                fromCurrency,
                toCurrency
            );
            return converted;
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    // Get exchange rate between two currencies
    const getExchangeRate = async (fromCurrency, toCurrency) => {
        if (fromCurrency === toCurrency) return 1;

        setError(null);
        try {
            const rate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
            return rate;
        } catch (error) {
            setError(error.message);
            return 1;
        }
    };

    // Get all exchange rates for a base currency
    const getAllRates = async (baseCurrency) => {
        setIsLoading(true);
        setError(null);

        try {
            const { rates, fromCache, isStale, isFallback } = await exchangeRateService.getExchangeRates(baseCurrency);
            setExchangeRates(prev => ({
                ...prev,
                [baseCurrency]: rates
            }));

            if (!fromCache) {
                setLastUpdated(new Date());
            }

            return { rates, fromCache, isStale, isFallback };
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh exchange rates
    const refreshRates = async () => {
        await exchangeRateService.clearCache();
        setExchangeRates({});
        setLastUpdated(null);
    };

    // Get cached rates if available
    const getCachedRates = (baseCurrency) => {
        return exchangeRates[baseCurrency] || null;
    };

    // Get all available currencies
    const getAllCurrencies = async () => {
        setCurrenciesLoading(true);
        setError(null);

        try {
            const { currencies: fetchedCurrencies, fromCache, isStale, isFallback } = await exchangeRateService.getAllCurrencies();
            setCurrencies(fetchedCurrencies);
            return { currencies: fetchedCurrencies, fromCache, isStale, isFallback };
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setCurrenciesLoading(false);
        }
    };

    // Get currencies (from state if available, otherwise fetch)
    const getCurrencies = async () => {
        if (currencies.length > 0) {
            return currencies;
        }
        const result = await getAllCurrencies();
        return result.currencies;
    };

    // Preload currencies on context initialization
    useEffect(() => {
        const preloadCurrencies = async () => {
            try {
                await getAllCurrencies();
            } catch (error) {
                console.log('Failed to preload currencies:', error);
            }
        };
        preloadCurrencies();
    }, []);

    const contextValue = {
        // State
        exchangeRates,
        isLoading,
        lastUpdated,
        error,
        currencies,
        currenciesLoading,

        // Actions
        convertAmount,
        getExchangeRate,
        getAllRates,
        refreshRates,
        getCachedRates,
        getAllCurrencies,
        getCurrencies,

        // Utility
        clearError: () => setError(null),
    };

    return (
        <ExchangeRateContext.Provider value={contextValue}>
            {children}
        </ExchangeRateContext.Provider>
    );
}; 