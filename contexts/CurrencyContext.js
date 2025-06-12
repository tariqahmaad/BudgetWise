import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    CURRENCIES,
    DEFAULT_CURRENCY,
    getCurrencyByCode,
    formatWithCurrency,
    CURRENCY_STORAGE_KEY
} from '../constants/currencies';
import {
    auth,
    firestore,
    doc,
    getDoc,
    setDoc,
    updateDoc
} from '../firebase/firebaseConfig';

// Create the context
const CurrencyContext = createContext();

// Hook to use the currency context
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

// Currency Provider Component
export const CurrencyProvider = ({ children }) => {
    const [currentCurrency, setCurrentCurrency] = useState(DEFAULT_CURRENCY);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved currency preference on app start
    useEffect(() => {
        loadCurrencyPreference();
    }, []);

    // Listen for auth state changes to load user preferences
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // User signed in, load their currency preference
                loadCurrencyPreference();
            } else {
                // User signed out, reset to default and load from AsyncStorage only
                loadLocalCurrencyPreference();
            }
        });

        return () => unsubscribe();
    }, []);

    const loadLocalCurrencyPreference = async () => {
        try {
            const savedCurrencyCode = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
            if (savedCurrencyCode) {
                const currency = getCurrencyByCode(savedCurrencyCode);
                setCurrentCurrency(currency);
            } else {
                setCurrentCurrency(DEFAULT_CURRENCY);
            }
        } catch (error) {
            console.error('Error loading local currency preference:', error);
            setCurrentCurrency(DEFAULT_CURRENCY);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCurrencyPreference = async () => {
        try {
            const user = auth.currentUser;

            if (user) {
                // Try to load from Firebase first
                try {
                    const userDocRef = doc(firestore, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        if (userData.currencyPreference) {
                            const currency = getCurrencyByCode(userData.currencyPreference);
                            setCurrentCurrency(currency);
                            // Sync with AsyncStorage
                            await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, userData.currencyPreference);
                            setIsLoading(false);
                            return;
                        }
                    }
                } catch (firebaseError) {
                    console.warn('Error loading currency from Firebase, falling back to AsyncStorage:', firebaseError);
                }
            }

            // Fallback to AsyncStorage if Firebase fails or user not authenticated
            await loadLocalCurrencyPreference();

        } catch (error) {
            console.error('Error loading currency preference:', error);
            setCurrentCurrency(DEFAULT_CURRENCY);
            setIsLoading(false);
        }
    };

    const changeCurrency = async (currencyCode) => {
        try {
            const newCurrency = getCurrencyByCode(currencyCode);
            setCurrentCurrency(newCurrency);

            // Save to AsyncStorage first (always works)
            await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currencyCode);

            // Try to save to Firebase if user is authenticated
            const user = auth.currentUser;
            if (user) {
                try {
                    const userDocRef = doc(firestore, 'users', user.uid);

                    // Check if user document exists
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        // Update existing document
                        await updateDoc(userDocRef, {
                            currencyPreference: currencyCode,
                            currencyUpdatedAt: new Date().toISOString()
                        });
                    } else {
                        // Create new document with currency preference
                        await setDoc(userDocRef, {
                            currencyPreference: currencyCode,
                            currencyUpdatedAt: new Date().toISOString(),
                            createdAt: new Date().toISOString()
                        }, { merge: true });
                    }

                    console.log(`Currency preference saved to Firebase: ${newCurrency.name} (${newCurrency.code})`);
                } catch (firebaseError) {
                    console.warn('Error saving currency to Firebase (saved to local storage):', firebaseError);
                }
            }

            console.log(`Currency changed to: ${newCurrency.name} (${newCurrency.code})`);
            return true;
        } catch (error) {
            console.error('Error saving currency preference:', error);
            return false;
        }
    };

    // Enhanced format amount function that uses current currency
    const formatAmount = (amount, options = {}) => {
        return formatWithCurrency(amount, currentCurrency.code, options);
    };

    // Get currency symbol only
    const getCurrencySymbol = () => {
        return currentCurrency.symbol;
    };

    // Get full currency info
    const getCurrencyInfo = () => {
        return currentCurrency;
    };

    // Get all available currencies
    const getAvailableCurrencies = () => {
        return CURRENCIES;
    };

    // Check if a specific currency is currently selected
    const isCurrencySelected = (currencyCode) => {
        return currentCurrency.code === currencyCode;
    };

    const contextValue = {
        // Current currency state
        currentCurrency,
        isLoading,

        // Currency operations
        changeCurrency,

        // Formatting functions
        formatAmount,
        getCurrencySymbol,
        getCurrencyInfo,

        // Utility functions
        getAvailableCurrencies,
        isCurrencySelected,

        // Direct access to currency data
        currencies: CURRENCIES,
        defaultCurrency: DEFAULT_CURRENCY,
    };

    return (
        <CurrencyContext.Provider value={contextValue}>
            {children}
        </CurrencyContext.Provider>
    );
};

export default CurrencyContext; 