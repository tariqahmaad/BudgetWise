import React, { useState, useEffect, useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';
import { useExchangeRate } from '../../contexts/ExchangeRateContext';

// Get device dimensions and calculate responsive values
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive calculations based on screen size
const getResponsiveDimensions = () => {
    const isTablet = screenWidth > 768;
    const isLandscape = screenWidth > screenHeight;
    const screenScale = Math.min(screenWidth / 375, 1.3); // Base scale on iPhone 11 width, max 1.3x

    return {
        isTablet,
        isLandscape,
        screenScale,
        // Modal dimensions
        modalPadding: isTablet ? SIZES.padding.xxlarge : SIZES.padding.xlarge,
        // Header dimensions
        headerPadding: isTablet ? 28 : 24,
        headerVerticalPadding: isTablet ? 24 : 20,
        titleFontSize: isTablet ? 24 : 20,
        closeButtonSize: isTablet ? 48 : 40,
        closeButtonIconSize: isTablet ? 28 : 24,
        // Search container dimensions
        searchPadding: isTablet ? 20 : 16,
        searchInputPadding: isTablet ? 18 : 16,
        searchIconSize: isTablet ? 24 : 20,
        searchFontSize: isTablet ? 18 : 16,
        searchBorderRadius: isTablet ? 12 : 10,
        // Currency list dimensions
        listPadding: isTablet ? 20 : 16,
        listTopPadding: isTablet ? 12 : 8,
        listBottomPadding: isTablet ? 20 : 16,
        // Currency item dimensions
        itemPadding: isTablet ? 20 : 16,
        itemVerticalPadding: isTablet ? 16 : 12,
        itemBorderRadius: isTablet ? 16 : 12,
        itemMarginBottom: isTablet ? 10 : 8,
        itemMinHeight: isTablet ? 80 : 70,
        // Currency content dimensions
        flagSize: isTablet ? 32 : 26,
        flagMarginRight: isTablet ? 20 : 16,
        codeFontSize: isTablet ? 20 : 17,
        nameFontSize: isTablet ? 16 : 14,
        iconSize: isTablet ? 24 : 20,
        // Loading/error state dimensions
        centerIconSize: isTablet ? 60 : 48,
        centerTextSize: isTablet ? 18 : 16,
        centerSubTextSize: isTablet ? 16 : 14,
        buttonPadding: isTablet ? 28 : 24,
        buttonVerticalPadding: isTablet ? 16 : 12,
        buttonFontSize: isTablet ? 16 : 14,
    };
};

// Currency flag mapping (basic set - can be expanded)
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
};

const CurrencyPickerModal = ({ visible, onClose, onSelect, selectedCurrency }) => {
    const { getCurrencies, currenciesLoading } = useExchangeRate();
    const [searchQuery, setSearchQuery] = useState('');
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get responsive dimensions
    const responsiveDimensions = getResponsiveDimensions();

    // Load currencies when modal opens
    useEffect(() => {
        if (visible && currencies.length === 0) {
            loadCurrencies();
        }
    }, [visible]);

    const loadCurrencies = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedCurrencies = await getCurrencies();
            setCurrencies(fetchedCurrencies);
        } catch (err) {
            console.error('Error loading currencies:', err);
            setError('Failed to load currencies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Enhanced currency data with flags and formatting
    const enhancedCurrencies = useMemo(() => {
        return currencies.map(currency => ({
            ...currency,
            flag: CURRENCY_FLAGS[currency.code] || '💱',
            displayName: currency.name,
            searchText: `${currency.code} ${currency.name}`.toLowerCase(),
        }));
    }, [currencies]);

    // Filter currencies based on search query
    const filteredCurrencies = useMemo(() => {
        if (!searchQuery.trim()) {
            return enhancedCurrencies;
        }

        const query = searchQuery.toLowerCase();
        return enhancedCurrencies.filter(currency =>
            currency.searchText.includes(query)
        );
    }, [enhancedCurrencies, searchQuery]);

    const renderCurrencyItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.currencyItem,
                {
                    paddingHorizontal: responsiveDimensions.itemPadding,
                    paddingVertical: responsiveDimensions.itemVerticalPadding,
                    borderRadius: responsiveDimensions.itemBorderRadius,
                    marginBottom: responsiveDimensions.itemMarginBottom,
                    minHeight: responsiveDimensions.itemMinHeight,
                },
                selectedCurrency === item.code && styles.selectedCurrencyItem
            ]}
            onPress={() => onSelect(item.code)}
            activeOpacity={0.7}
        >
            <View style={styles.currencyLeft}>
                <Text style={[
                    styles.currencyFlag,
                    {
                        fontSize: responsiveDimensions.flagSize,
                        marginRight: responsiveDimensions.flagMarginRight,
                    }
                ]}>{item.flag}</Text>
                <View style={styles.currencyInfo}>
                    <Text style={[
                        styles.currencyCode,
                        { fontSize: responsiveDimensions.codeFontSize }
                    ]}>{item.code}</Text>
                    <Text style={[
                        styles.currencyName,
                        { fontSize: responsiveDimensions.nameFontSize }
                    ]} numberOfLines={1}>
                        {item.displayName}
                    </Text>
                </View>
            </View>
            <View style={styles.currencyRight}>
                {selectedCurrency === item.code && (
                    <Ionicons
                        name="checkmark-circle"
                        size={responsiveDimensions.iconSize}
                        color={COLORS.primary}
                    />
                )}
            </View>
        </TouchableOpacity>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={[
                        styles.loadingText,
                        { fontSize: responsiveDimensions.centerTextSize }
                    ]}>Loading currencies...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={responsiveDimensions.centerIconSize}
                        color="#FF6B6B"
                    />
                    <Text style={[
                        styles.errorText,
                        { fontSize: responsiveDimensions.centerTextSize }
                    ]}>{error}</Text>
                    <TouchableOpacity
                        style={[
                            styles.retryButton,
                            {
                                paddingHorizontal: responsiveDimensions.buttonPadding,
                                paddingVertical: responsiveDimensions.buttonVerticalPadding,
                            }
                        ]}
                        onPress={loadCurrencies}
                    >
                        <Text style={[
                            styles.retryButtonText,
                            { fontSize: responsiveDimensions.buttonFontSize }
                        ]}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (filteredCurrencies.length === 0 && searchQuery) {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons
                        name="search-outline"
                        size={responsiveDimensions.centerIconSize}
                        color={COLORS.gray}
                    />
                    <Text style={[
                        styles.emptyText,
                        { fontSize: responsiveDimensions.centerTextSize }
                    ]}>No currencies found</Text>
                    <Text style={[
                        styles.emptySubText,
                        { fontSize: responsiveDimensions.centerSubTextSize }
                    ]}>Try a different search term</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={filteredCurrencies}
                renderItem={renderCurrencyItem}
                keyExtractor={(item) => item.code}
                showsVerticalScrollIndicator={false}
                style={[
                    styles.currencyList,
                    {
                        paddingHorizontal: responsiveDimensions.listPadding,
                        paddingTop: responsiveDimensions.listTopPadding,
                        paddingBottom: responsiveDimensions.listBottomPadding,
                    }
                ]}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                getItemLayout={(data, index) => ({
                    length: responsiveDimensions.itemMinHeight + responsiveDimensions.itemMarginBottom,
                    offset: (responsiveDimensions.itemMinHeight + responsiveDimensions.itemMarginBottom) * index,
                    index,
                })}
            />
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            statusBarTranslucent={true}
        >
            <SafeAreaView style={styles.modalContainer}>
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
                    ]}>Select Currency</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[
                            styles.closeButton,
                            {
                                width: responsiveDimensions.closeButtonSize,
                                height: responsiveDimensions.closeButtonSize,
                                borderRadius: responsiveDimensions.closeButtonSize / 2,
                            }
                        ]}
                    >
                        <Ionicons
                            name="close"
                            size={responsiveDimensions.closeButtonIconSize}
                            color={COLORS.text}
                        />
                    </TouchableOpacity>
                </View>

                <View style={[
                    styles.searchContainer,
                    {
                        paddingHorizontal: responsiveDimensions.headerPadding,
                        paddingVertical: responsiveDimensions.searchPadding,
                    }
                ]}>
                    <View style={[
                        styles.searchInputContainer,
                        {
                            borderRadius: responsiveDimensions.searchBorderRadius,
                            paddingHorizontal: responsiveDimensions.searchInputPadding,
                            paddingVertical: responsiveDimensions.searchInputPadding,
                        }
                    ]}>
                        <Ionicons
                            name="search-outline"
                            size={responsiveDimensions.searchIconSize}
                            color={COLORS.gray}
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={[
                                styles.searchInput,
                                { fontSize: responsiveDimensions.searchFontSize }
                            ]}
                            placeholder="Search currencies..."
                            placeholderTextColor={COLORS.gray}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCorrect={false}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons
                                    name="close-circle"
                                    size={responsiveDimensions.searchIconSize}
                                    color={COLORS.gray}
                                />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {renderContent()}
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#F5F6FA',
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
        letterSpacing: 0.3,
    },
    closeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    searchContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        color: COLORS.text,
    },
    currencyList: {
        flex: 1,
    },
    currencyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    selectedCurrencyItem: {
        backgroundColor: '#FFF8E1',
        borderWidth: 2,
        borderColor: COLORS.primary,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    currencyLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    currencyFlag: {
        // fontSize and marginRight handled dynamically
    },
    currencyInfo: {
        flex: 1,
    },
    currencyCode: {
        fontFamily: 'Poppins-Bold',
        color: COLORS.text,
        letterSpacing: 0.3,
    },
    currencyName: {
        fontFamily: 'Poppins-Medium',
        color: COLORS.textSecondary || '#666',
        marginTop: 3,
    },
    currencyRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: screenWidth * 0.1, // 10% of screen width
    },
    loadingText: {
        marginTop: 16,
        fontFamily: 'Poppins-Medium',
        color: COLORS.text,
    },
    errorText: {
        marginTop: 16,
        fontFamily: 'Poppins-Medium',
        color: '#FF6B6B',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    retryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: 'white',
    },
    emptyText: {
        marginTop: 16,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        textAlign: 'center',
    },
    emptySubText: {
        marginTop: 8,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray,
        textAlign: 'center',
    },
});

export default CurrencyPickerModal; 