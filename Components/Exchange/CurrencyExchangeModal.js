import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Animated,
    Easing,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';
import CurrencyInputSection from './CurrencyInputSection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Add responsive dimensions function after the imports and before the main component
const getResponsiveDimensions = () => {
    const isTablet = screenWidth > 768;
    const isLandscape = screenWidth > screenHeight;
    const screenScale = Math.min(screenWidth / 375, 1.3); // Base scale on iPhone 11 width, max 1.3x

    return {
        isTablet,
        isLandscape,
        screenScale,
        // Modal and header dimensions
        headerPadding: isTablet ? 28 : 24,
        headerVerticalPadding: isTablet ? 24 : 20,
        titleFontSize: isTablet ? 26 : 22,
        closeButtonSize: isTablet ? 48 : 40,
        closeButtonIconSize: isTablet ? 28 : 24,
        // Content dimensions
        contentPadding: isTablet ? 20 : 16,
        // Exchange rate container dimensions
        exchangeContainerMargin: isTablet ? 16 : 12,
        exchangeContainerPadding: isTablet ? 20 : 16,
        exchangeContainerRadius: isTablet ? 20 : 16,
        swapButtonSize: isTablet ? 64 : 56,
        swapButtonIconSize: isTablet ? 28 : 24,
        rateTextSize: isTablet ? 20 : 18,
        lastUpdatedTextSize: isTablet ? 14 : 12,
        loadingTextSize: isTablet ? 16 : 14,
        statusTextSize: isTablet ? 14 : 12,
        statusDotSize: isTablet ? 8 : 6,
        // Error container dimensions
        errorPadding: isTablet ? 20 : 16,
        errorRadius: isTablet ? 16 : 12,
        errorTitleSize: isTablet ? 16 : 14,
        errorTextSize: isTablet ? 15 : 13,
        errorIconMargin: isTablet ? 16 : 12,
        // Quick amount container dimensions
        quickContainerMargin: isTablet ? 20 : 16,
        quickContainerPadding: isTablet ? 20 : 16,
        quickContainerRadius: isTablet ? 20 : 16,
        quickTitleSize: isTablet ? 18 : 16,
        quickTitleMargin: isTablet ? 20 : 16,
        quickButtonPadding: isTablet ? 20 : 16,
        quickButtonVerticalPadding: isTablet ? 16 : 12,
        quickButtonRadius: isTablet ? 28 : 24,
        quickButtonMargin: isTablet ? 16 : 12,
        quickButtonTextSize: isTablet ? 16 : 14,
        // Reset button dimensions
        resetButtonPadding: isTablet ? 16 : 12,
        resetButtonRadius: isTablet ? 16 : 12,
        resetButtonMargin: isTablet ? 16 : 12,
        resetIconSize: isTablet ? 24 : 20,
        resetTextSize: isTablet ? 18 : 16,
    };
};

const CurrencyExchangeModal = ({ isVisible, onClose }) => {
    const { currentCurrency } = useCurrency();
    const { convertAmount, getExchangeRate, isLoading, error, clearError } = useExchangeRate();

    // Get responsive dimensions
    const responsiveDimensions = getResponsiveDimensions();

    const [fromCurrency, setFromCurrency] = useState(currentCurrency.code);
    const [toCurrency, setToCurrency] = useState('USD');
    const [fromAmount, setFromAmount] = useState('');
    const [toAmount, setToAmount] = useState('');
    const [exchangeRate, setExchangeRate] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [conversionTimeout, setConversionTimeout] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [rateCache, setRateCache] = useState({}); // Cache for exchange rates

    // Animation values
    const swapAnimation = useState(new Animated.Value(1))[0];
    const pulseAnimation = useState(new Animated.Value(1))[0];

    // Initialize with different currencies
    useEffect(() => {
        if (currentCurrency.code === 'USD') {
            setToCurrency('EUR');
        } else {
            setFromCurrency(currentCurrency.code);
            setToCurrency('USD');
        }
    }, [currentCurrency]);

    // Handle conversion when currencies change (but not amounts to avoid loops)
    useEffect(() => {
        if (fromAmount && parseFloat(fromAmount) > 0) {
            // Clear the display first
            setToAmount('');
            setExchangeRate(null);
            // Then trigger fresh conversion
            setTimeout(() => handleConversion(), 100);
        } else {
            setToAmount('');
            setExchangeRate(null);
        }
    }, [fromCurrency, toCurrency]);

    // Store exchange rates in cache for immediate conversion
    useEffect(() => {
        if (exchangeRate && fromCurrency && toCurrency) {
            const cacheKey = `${fromCurrency}_${toCurrency}`;
            setRateCache(prev => ({
                ...prev,
                [cacheKey]: exchangeRate
            }));
        }
    }, [exchangeRate, fromCurrency, toCurrency]);

    const handleConversion = async () => {
        if (!fromAmount || fromAmount === '0' || parseFloat(fromAmount) <= 0 || isNaN(parseFloat(fromAmount))) {
            setToAmount('');
            setExchangeRate(null);
            return;
        }

        setIsConverting(true);
        clearError();

        try {
            const amount = parseFloat(fromAmount);

            if (fromCurrency === toCurrency) {
                setToAmount(amount.toFixed(2));
                setExchangeRate(1);
                setLastUpdated(new Date());
                setIsConverting(false);
                return;
            }

            // Get conversion and rate simultaneously with timeout
            const conversionPromise = Promise.race([
                Promise.all([
                    convertAmount(amount, fromCurrency, toCurrency),
                    getExchangeRate(fromCurrency, toCurrency)
                ]),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), 10000)
                )
            ]);

            const [converted, rate] = await conversionPromise;

            setToAmount(converted.toFixed(2));
            setExchangeRate(rate);
            setLastUpdated(new Date());

            // Success animation
            Animated.sequence([
                Animated.timing(pulseAnimation, {
                    toValue: 1.05,
                    duration: 150,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnimation, {
                    toValue: 1,
                    duration: 150,
                    easing: Easing.ease,
                    useNativeDriver: true,
                }),
            ]).start();

        } catch (error) {
            console.error('Conversion error:', error);
            const errorMessage = error.message === 'Request timeout'
                ? 'Request timed out. Please try again.'
                : 'Unable to get exchange rate. Please check your internet connection and try again.';

            Alert.alert('Conversion Error', errorMessage, [{ text: 'OK' }]);
        } finally {
            setIsConverting(false);
        }
    };

    const handleFromAmountChange = (text) => {
        // Only allow numbers and one decimal point
        const cleanText = text.replace(/[^0-9.]/g, '');
        const parts = cleanText.split('.');
        if (parts.length > 2) return; // Prevent multiple decimal points

        // Limit to 2 decimal places
        if (parts[1] && parts[1].length > 2) {
            return;
        }

        // Prevent leading zeros except for decimals
        if (cleanText.length > 1 && cleanText[0] === '0' && cleanText[1] !== '.') {
            return;
        }

        setFromAmount(cleanText);

        // Clear any existing timeout
        if (conversionTimeout) {
            clearTimeout(conversionTimeout);
        }

        // If input is empty or zero, clear immediately
        if (!cleanText || parseFloat(cleanText) <= 0) {
            setToAmount('');
            setExchangeRate(null);
            setIsTyping(false);
            return;
        }

        const amount = parseFloat(cleanText);
        if (isNaN(amount)) return;

        // IMMEDIATE CONVERSION - Always try to show something instantly
        const cacheKey = `${fromCurrency}_${toCurrency}`;
        const reverseCacheKey = `${toCurrency}_${fromCurrency}`;

        let immediateRate = null;

        if (fromCurrency === toCurrency) {
            // Same currency
            setToAmount(amount.toFixed(2));
            setExchangeRate(1);
            setIsTyping(false);
            return;
        } else if (exchangeRate && exchangeRate > 0) {
            // Use current exchange rate
            immediateRate = exchangeRate;
        } else if (rateCache[cacheKey]) {
            // Use cached rate
            immediateRate = rateCache[cacheKey];
        } else if (rateCache[reverseCacheKey]) {
            // Use reverse cached rate
            immediateRate = 1 / rateCache[reverseCacheKey];
        }

        // Show immediate conversion if we have any rate
        if (immediateRate && immediateRate > 0) {
            const localConverted = amount * immediateRate;
            setToAmount(localConverted.toFixed(2));
            if (!exchangeRate) {
                setExchangeRate(immediateRate);
            }
            console.log(`Immediate conversion: ${amount} ${fromCurrency} = ${localConverted.toFixed(2)} ${toCurrency} (rate: ${immediateRate})`);
        } else {
            console.log(`No immediate rate available for ${fromCurrency} -> ${toCurrency}`);
        }

        // Always trigger API call for fresh rates (but with minimal delay)
        setIsTyping(true);
        const timeout = setTimeout(() => {
            setIsTyping(false);
            handleConversion();
        }, immediateRate ? 300 : 100); // Longer delay if we showed immediate result

        setConversionTimeout(timeout);
    };

    const handleSwapCurrencies = () => {
        // Animate swap button
        Animated.sequence([
            Animated.timing(swapAnimation, {
                toValue: 0.8,
                duration: 100,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
            Animated.timing(swapAnimation, {
                toValue: 1,
                duration: 100,
                easing: Easing.ease,
                useNativeDriver: true,
            }),
        ]).start();

        const tempCurrency = fromCurrency;
        const tempAmount = fromAmount;

        setFromCurrency(toCurrency);
        setToCurrency(tempCurrency);
        setFromAmount(toAmount);
        setToAmount(tempAmount);

        // Update exchange rate - try to get from cache first
        const cacheKey = `${toCurrency}_${tempCurrency}`;
        if (rateCache[cacheKey]) {
            setExchangeRate(rateCache[cacheKey]);
        } else if (exchangeRate && exchangeRate !== 0) {
            const newRate = 1 / exchangeRate;
            setExchangeRate(newRate);
            // Cache the new rate
            setRateCache(prev => ({
                ...prev,
                [cacheKey]: newRate
            }));
        }
    };

    const resetForm = () => {
        setFromAmount('');
        setToAmount('');
        setExchangeRate(null);
        setLastUpdated(null);
        setIsTyping(false);
        // Don't clear rate cache - keep it for better UX
        clearError();
    };

    const handleClose = () => {
        // Clean up timeouts
        if (conversionTimeout) {
            clearTimeout(conversionTimeout);
            setConversionTimeout(null);
        }
        setIsTyping(false);
        resetForm();
        onClose();
    };

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (conversionTimeout) {
                clearTimeout(conversionTimeout);
            }
        };
    }, [conversionTimeout]);

    const formatExchangeRate = (rate) => {
        if (!rate) return '';
        return rate.toFixed(2);
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <SafeAreaView style={styles.modalContainer}>
                {/* Header */}
                <View style={[
                    styles.header,
                    {
                        paddingHorizontal: responsiveDimensions.headerPadding,
                        paddingVertical: responsiveDimensions.headerVerticalPadding,
                    }
                ]}>
                    <Text style={[
                        styles.title,
                        { fontSize: responsiveDimensions.titleFontSize }
                    ]}>Currency Exchange</Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={[
                            styles.closeButton,
                            {
                                width: responsiveDimensions.closeButtonSize,
                                height: responsiveDimensions.closeButtonSize,
                                borderRadius: responsiveDimensions.closeButtonSize / 2,
                            }
                        ]}
                    >
                        <Ionicons name="close" size={responsiveDimensions.closeButtonIconSize} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={[
                        styles.content,
                        {
                            paddingHorizontal: responsiveDimensions.contentPadding,
                            paddingVertical: responsiveDimensions.contentPadding,
                        }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* From Currency Section */}
                    <CurrencyInputSection
                        label="From"
                        currency={fromCurrency}
                        amount={fromAmount}
                        onCurrencyChange={setFromCurrency}
                        onAmountChange={handleFromAmountChange}
                        onAmountSubmit={() => {
                            // Clear any pending timeout and immediately convert
                            if (conversionTimeout) {
                                clearTimeout(conversionTimeout);
                                setConversionTimeout(null);
                            }
                            setIsTyping(false);
                            if (fromAmount && parseFloat(fromAmount) > 0) {
                                handleConversion();
                            }
                        }}
                        placeholder="Enter amount"
                    />

                    {/* Exchange Rate Section */}
                    <View style={[
                        styles.exchangeRateContainer,
                        {
                            marginVertical: responsiveDimensions.exchangeContainerMargin,
                            paddingVertical: responsiveDimensions.exchangeContainerPadding,
                            borderRadius: responsiveDimensions.exchangeContainerRadius,
                        }
                    ]}>
                        <Animated.View style={{ transform: [{ scale: swapAnimation }] }}>
                            <TouchableOpacity
                                style={[
                                    styles.swapButton,
                                    {
                                        width: responsiveDimensions.swapButtonSize,
                                        height: responsiveDimensions.swapButtonSize,
                                        borderRadius: responsiveDimensions.swapButtonSize / 2,
                                    },
                                    isConverting && { opacity: 0.6 }
                                ]}
                                onPress={handleSwapCurrencies}
                                disabled={isConverting}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name="swap-vertical"
                                    size={responsiveDimensions.swapButtonIconSize}
                                    color="white"
                                />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Exchange Rate Display */}
                        {exchangeRate !== null && (
                            <Animated.View
                                style={[styles.rateDisplay, { transform: [{ scale: pulseAnimation }] }]}
                            >
                                <Text style={[
                                    styles.rateText,
                                    { fontSize: responsiveDimensions.rateTextSize }
                                ]}>
                                    1 {fromCurrency} = {formatExchangeRate(exchangeRate)} {toCurrency}
                                </Text>
                                {lastUpdated && (
                                    <Text style={[
                                        styles.lastUpdatedText,
                                        { fontSize: responsiveDimensions.lastUpdatedTextSize }
                                    ]}>
                                        Updated: {lastUpdated.toLocaleTimeString()}
                                    </Text>
                                )}
                            </Animated.View>
                        )}

                        {(isConverting || isTyping) && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={[
                                    styles.loadingText,
                                    { fontSize: responsiveDimensions.loadingTextSize }
                                ]}>
                                    {isTyping ? 'Calculating...' : 'Getting latest rates...'}
                                </Text>
                            </View>
                        )}

                        {/* Live Rate Status - Always visible when rate exists */}
                        {exchangeRate !== null && (
                            <View style={styles.statusContainer}>
                                <View style={[
                                    styles.statusDot,
                                    {
                                        width: responsiveDimensions.statusDotSize,
                                        height: responsiveDimensions.statusDotSize,
                                        borderRadius: responsiveDimensions.statusDotSize / 2,
                                    }
                                ]} />
                                <Text style={[
                                    styles.statusText,
                                    { fontSize: responsiveDimensions.statusTextSize }
                                ]}>Live rates</Text>
                            </View>
                        )}
                    </View>

                    {/* To Currency Section */}
                    <CurrencyInputSection
                        label="To"
                        currency={toCurrency}
                        amount={toAmount}
                        onCurrencyChange={setToCurrency}
                        onAmountChange={() => { }} // Read-only
                        editable={false}
                        placeholder="Exchange"
                    />

                    {/* Error Display */}
                    {error && (
                        <Animated.View
                            style={[
                                styles.errorContainer,
                                {
                                    padding: responsiveDimensions.errorPadding,
                                    borderRadius: responsiveDimensions.errorRadius,
                                }
                            ]}
                            entering="fadeInDown"
                            exiting="fadeOutUp"
                        >
                            <View style={[
                                styles.errorIconContainer,
                                { marginRight: responsiveDimensions.errorIconMargin }
                            ]}>
                                <Ionicons name="warning-outline" size={22} color="#FF3B30" />
                            </View>
                            <View style={styles.errorTextContainer}>
                                <Text style={[
                                    styles.errorTitle,
                                    { fontSize: responsiveDimensions.errorTitleSize }
                                ]}>Connection Error</Text>
                                <Text style={[
                                    styles.errorText,
                                    { fontSize: responsiveDimensions.errorTextSize }
                                ]}>{error}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.errorCloseButton}
                                onPress={() => clearError()}
                            >
                                <Ionicons name="close" size={18} color="#FF3B30" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Quick Amount Buttons */}
                    <View style={[
                        styles.quickAmountContainer,
                        {
                            marginTop: responsiveDimensions.quickContainerMargin,
                            padding: responsiveDimensions.quickContainerPadding,
                            borderRadius: responsiveDimensions.quickContainerRadius,
                        }
                    ]}>
                        <Text style={[
                            styles.quickAmountTitle,
                            {
                                fontSize: responsiveDimensions.quickTitleSize,
                                marginBottom: responsiveDimensions.quickTitleMargin,
                            }
                        ]}>Quick amounts:</Text>
                        <View style={styles.quickAmountButtons}>
                            {['10', '50', '100', '500', '1000'].map((amount) => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[
                                        styles.quickAmountButton,
                                        {
                                            paddingHorizontal: responsiveDimensions.quickButtonPadding,
                                            paddingVertical: responsiveDimensions.quickButtonVerticalPadding,
                                            borderRadius: responsiveDimensions.quickButtonRadius,
                                            marginBottom: responsiveDimensions.quickButtonMargin,
                                        }
                                    ]}
                                    onPress={() => {
                                        // Clear any pending timeout
                                        if (conversionTimeout) {
                                            clearTimeout(conversionTimeout);
                                            setConversionTimeout(null);
                                        }
                                        setIsTyping(false);

                                        // Use the same logic as handleFromAmountChange for consistency
                                        handleFromAmountChange(amount);
                                    }}
                                >
                                    <Text style={[
                                        styles.quickAmountButtonText,
                                        { fontSize: responsiveDimensions.quickButtonTextSize }
                                    ]}>{amount}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={[
                            styles.resetButton,
                            {
                                paddingVertical: responsiveDimensions.resetButtonPadding,
                                borderRadius: responsiveDimensions.resetButtonRadius,
                                marginTop: responsiveDimensions.resetButtonMargin,
                                marginBottom: responsiveDimensions.resetButtonMargin,
                            }
                        ]}
                        onPress={resetForm}
                    >
                        <Ionicons name="refresh" size={responsiveDimensions.resetIconSize} color={COLORS.text} />
                        <Text style={[
                            styles.resetButtonText,
                            { fontSize: responsiveDimensions.resetTextSize }
                        ]}>Reset</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 10,
        paddingTop: 50,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    closeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
    },
    exchangeRateContainer: {
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    swapButton: {
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 16,
        transform: [{ scale: 1 }],
    },
    rateDisplay: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    rateText: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    lastUpdatedText: {
        fontFamily: 'Poppins-Regular',
        color: COLORS.textSecondary,
        marginTop: 6,
        textAlign: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    loadingText: {
        fontFamily: 'Poppins-Medium',
        color: COLORS.textSecondary,
        marginLeft: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    statusDot: {
        backgroundColor: '#4CAF50',
        marginRight: 6,
    },
    statusText: {
        fontFamily: 'Poppins-Medium',
        color: '#4CAF50',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        marginVertical: 12,
        marginHorizontal: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
        elevation: 2,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    errorIconContainer: {
        // marginRight handled dynamically
    },
    errorTextContainer: {
        flex: 1,
    },
    errorTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: '#FF3B30',
        marginBottom: 2,
    },
    errorText: {
        fontFamily: 'Poppins-Regular',
        color: '#D32F2F',
        lineHeight: 18,
    },
    errorCloseButton: {
        padding: 4,
        marginLeft: 8,
    },
    quickAmountContainer: {
        backgroundColor: 'white',
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    quickAmountTitle: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        textAlign: 'center',
    },
    quickAmountButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    quickAmountButton: {
        backgroundColor: '#F8F9FA',
        minWidth: screenWidth * 0.18, // 18% of screen width
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E9ECEF',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    quickAmountButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    resetButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        marginLeft: 8,
    },
});

export default CurrencyExchangeModal; 