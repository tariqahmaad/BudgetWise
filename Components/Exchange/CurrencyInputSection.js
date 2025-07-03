import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { getCurrencyByCode } from '../../constants/currencies';
import CurrencyPickerModal from './CurrencyPickerModal';

const CurrencyInputSection = ({
    label,
    currency,
    amount,
    onCurrencyChange,
    onAmountChange,
    onAmountSubmit,
    editable = true,
    placeholder = "0.00"
}) => {
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

    const currencyInfo = getCurrencyByCode(currency);

    return (
        <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>{label}</Text>

            <View style={styles.inputContainer}>
                <TouchableOpacity
                    style={styles.currencySelector}
                    onPress={() => setShowCurrencyPicker(true)}
                >
                    <Text style={styles.currencyFlag}>{currencyInfo.flag}</Text>
                    <Text style={styles.currencyCode}>{currency}</Text>
                    <Ionicons name="chevron-down" size={16} color={COLORS.text} />
                </TouchableOpacity>

                <TextInput
                    style={[styles.amountInput, !editable && styles.readOnlyInput]}
                    value={amount}
                    onChangeText={onAmountChange}
                    onSubmitEditing={onAmountSubmit}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    editable={editable}
                    returnKeyType="done"
                    selectTextOnFocus={editable}
                />
            </View>

            <CurrencyPickerModal
                visible={showCurrencyPicker}
                onClose={() => setShowCurrencyPicker(false)}
                onSelect={(currencyCode) => {
                    onCurrencyChange(currencyCode);
                    setShowCurrencyPicker(false);
                }}
                selectedCurrency={currency}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputSection: {
        marginVertical: 12,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    currencySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingRight: 16,
        borderRightWidth: 1,
        borderRightColor: '#E8E8E8',
        minWidth: 100,
    },
    currencyFlag: {
        fontSize: 22,
        marginRight: 10,
    },
    currencyCode: {
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
        color: COLORS.text,
        marginRight: 6,
        letterSpacing: 0.3,
    },
    amountInput: {
        flex: 1,
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        color: COLORS.text,
        paddingVertical: 18,
        paddingHorizontal: 16,
        textAlign: 'right',
        letterSpacing: 0.5,
    },
    readOnlyInput: {
        color: COLORS.textSecondary,
        backgroundColor: 'transparent',
    },
});

export default CurrencyInputSection; 