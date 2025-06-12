import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Platform,
    Alert,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCurrency } from '../../contexts/CurrencyContext';
import { COLORS, SIZES, SHADOWS } from '../../constants/theme';
import ScreenWrapper from '../../Components/ScreenWrapper';
import BackButton from '../../Components/Buttons/BackButton';

const CurrencySelectionScreen = ({ navigation }) => {
    const {
        currentCurrency,
        changeCurrency,
        getAvailableCurrencies,
        isCurrencySelected
    } = useCurrency();

    const [isChanging, setIsChanging] = useState(false);
    const [selectedCode, setSelectedCode] = useState(null);

    const currencies = getAvailableCurrencies();

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleCurrencySelect = async (currencyCode) => {
        // Don't allow selecting the same currency
        if (isCurrencySelected(currencyCode)) {
            return;
        }

        setIsChanging(true);
        setSelectedCode(currencyCode);

        try {
            const success = await changeCurrency(currencyCode);

            if (success) {
                // Show success feedback
                Alert.alert(
                    "Currency Updated",
                    `Your default currency has been changed to ${currencies.find(c => c.code === currencyCode)?.name}.`,
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Error", "Failed to update currency. Please try again.");
            }
        } catch (error) {
            console.error('Error changing currency:', error);
            Alert.alert("Error", "Failed to update currency. Please try again.");
        } finally {
            setIsChanging(false);
            setSelectedCode(null);
        }
    };

    const renderCurrencyItem = ({ item }) => {
        const isSelected = isCurrencySelected(item.code);
        const isLoading = isChanging && selectedCode === item.code;

        return (
            <TouchableOpacity
                style={[
                    styles.currencyItem,
                    isSelected && styles.selectedCurrencyItem,
                ]}
                onPress={() => handleCurrencySelect(item.code)}
                disabled={isChanging}
                activeOpacity={0.7}
            >
                <View style={styles.currencyHeader}>
                    <Text style={styles.currencyFlag}>{item.flag}</Text>
                    {isSelected && (
                        <View style={styles.selectedBadge}>
                            <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        </View>
                    )}
                </View>

                <View style={styles.currencyInfo}>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                    <Text style={styles.currencyCode}>{item.code}</Text>
                    <Text style={styles.currencyName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.currencyCountry} numberOfLines={1}>
                        {item.country}
                    </Text>
                </View>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper backgroundColor={COLORS.white}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <BackButton onPress={handleBackPress} />
                    <Text style={styles.title}>Select Currency</Text>
                </View>

                {/* Current Currency Info */}
                <View style={styles.currentCurrencyContainer}>
                    <Text style={styles.currentCurrencyLabel}>Current Currency</Text>
                    <View style={styles.currentCurrencyDisplay}>
                        <Text style={styles.currentCurrencyFlag}>{currentCurrency.flag}</Text>
                        <View style={styles.currentCurrencyInfo}>
                            <Text style={styles.currentCurrencyName}>
                                {currentCurrency.name}
                            </Text>
                            <Text style={styles.currentCurrencyDetails}>
                                {currentCurrency.symbol} • {currentCurrency.code} • {currentCurrency.country}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description */}
                <Text style={styles.description}>
                    Choose your preferred currency. This will be used throughout the app for displaying amounts.
                </Text>

                {/* Currency Grid */}
                <FlatList
                    data={currencies}
                    renderItem={renderCurrencyItem}
                    keyExtractor={(item) => item.code}
                    numColumns={2}
                    contentContainerStyle={styles.currencyGrid}
                    columnWrapperStyle={styles.currencyRow}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={!isChanging}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: SIZES.padding.xxlarge,
        marginBottom: SIZES.padding.large,
    },
    title: {
        fontSize: SIZES.font.xlarge,
        color: COLORS.text,
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        flex: 1,
        marginRight: SIZES.padding.xxlarge,
    },
    currentCurrencyContainer: {
        backgroundColor: COLORS.primary + '10',
        borderRadius: SIZES.radius.medium,
        padding: SIZES.padding.large,
        marginHorizontal: SIZES.padding.xxlarge,
        marginBottom: SIZES.padding.large,
    },
    currentCurrencyLabel: {
        fontSize: SIZES.font.medium,
        color: COLORS.textSecondary,
        fontFamily: 'Poppins-Medium',
        marginBottom: SIZES.padding.small,
    },
    currentCurrencyDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currentCurrencyFlag: {
        fontSize: 32,
        marginRight: SIZES.padding.medium,
    },
    currentCurrencyInfo: {
        flex: 1,
    },
    currentCurrencyName: {
        fontSize: SIZES.font.large,
        color: COLORS.text,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 2,
    },
    currentCurrencyDetails: {
        fontSize: SIZES.font.small,
        color: COLORS.textSecondary,
        fontFamily: 'Poppins-Regular',
    },
    description: {
        fontSize: SIZES.font.medium,
        color: COLORS.textSecondary,
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        marginHorizontal: SIZES.padding.xxlarge,
        marginBottom: SIZES.padding.large,
        lineHeight: 20,
    },
    currencyGrid: {
        paddingHorizontal: SIZES.padding.large,
        paddingBottom: SIZES.padding.xxxlarge,
    },
    currencyRow: {
        justifyContent: 'space-between',
    },
    currencyItem: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius.medium,
        padding: SIZES.padding.medium,
        marginBottom: SIZES.padding.medium,
        marginHorizontal: SIZES.padding.small,
        borderWidth: 2,
        borderColor: COLORS.lightGray,
        ...SHADOWS.small,
        position: 'relative',
    },
    selectedCurrencyItem: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '05',
    },
    currencyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SIZES.padding.small,
    },
    currencyFlag: {
        fontSize: 28,
    },
    selectedBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencyInfo: {
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 24,
        color: COLORS.text,
        fontFamily: 'Poppins-Bold',
        marginBottom: 4,
    },
    currencyCode: {
        fontSize: SIZES.font.medium,
        color: COLORS.text,
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 2,
    },
    currencyName: {
        fontSize: SIZES.font.small,
        color: COLORS.textSecondary,
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
        marginBottom: 2,
    },
    currencyCountry: {
        fontSize: SIZES.font.small - 2,
        color: COLORS.textTertiary,
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: SIZES.radius.medium,
    },
});

export default CurrencySelectionScreen; 