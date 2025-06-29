// Create this file: Components/Settings/AddCategoryModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Platform,
    Keyboard,
    FlatList,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    firestore,
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs
} from '../../firebase/firebaseConfig'; // Adjust path if needed
import SelectionModal from '../SelectionModel'; // Adjust path if needed
import { COLORS, DEFAULT_CATEGORY_COLORS, SIZES, SHADOWS } from '../../constants/theme'; // Adjust path if needed
import { useCurrency } from '../../contexts/CurrencyContext';

// Common icon suggestions for categories
const SUGGESTED_ICONS = [
    { name: 'basket-outline', label: 'Groceries', color: '#4CAF50' },
    { name: 'home-outline', label: 'Housing', color: '#4CAF50' },
    { name: 'car-outline', label: 'Transport', color: '#4CAF50' },
    { name: 'fast-food-outline', label: 'Food', color: '#4CAF50' },
    { name: 'medical-outline', label: 'Healthcare', color: '#4CAF50' },
    { name: 'shirt-outline', label: 'Clothing', color: '#4CAF50' },
    { name: 'film-outline', label: 'Entertainment', color: '#4CAF50' },
    { name: 'wifi-outline', label: 'Utilities', color: '#4CAF50' },
    { name: 'school-outline', label: 'Education', color: '#4CAF50' },
    { name: 'gift-outline', label: 'Gifts', color: '#4CAF50' },
    { name: 'card-outline', label: 'Finance', color: '#4CAF50' },
    { name: 'airplane-outline', label: 'Travel', color: '#4CAF50' },
    { name: 'fitness-outline', label: 'Health & Fitness', color: '#4CAF50' },
    { name: 'game-controller-outline', label: 'Gaming', color: '#4CAF50' },
    { name: 'book-outline', label: 'Books', color: '#4CAF50' },
];

// --- Helper Function (copied from SettingsScreen or moved to a common utils file) ---
const validateInput = (value, type = 'text') => {
    if (value === null || value === undefined) return false;
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    if (trimmedValue === '') return false;
    if (type === 'icon') {
        // Basic check for common Ionicons pattern (lowercase, hyphens, optional -outline)
        return /^[a-z0-9]+(-[a-z0-9]+)*(-outline)?$/.test(trimmedValue);
    }
    return true;
};

// --- Helper to get label (copied from SettingsScreen or moved to a common utils file) ---
const getLabelFromValue = (options, value) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : 'Select...';
};

const AddCategoryModal = ({ isVisible, onClose, user }) => {
    const { formatAmount } = useCurrency();
    const [isLoading, setIsLoading] = useState(false);
    const [isCategoryColorModalVisible, setCategoryColorModalVisible] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [categoryIcon, setCategoryIcon] = useState(SUGGESTED_ICONS[0].name);
    const [categoryColor, setCategoryColor] = useState(DEFAULT_CATEGORY_COLORS[0].value);
    const [categoryNameError, setCategoryNameError] = useState('');
    const [selectedIconIndex, setSelectedIconIndex] = useState(0);

    // Refs for inputs
    const nameInputRef = useRef(null);
    const scrollViewRef = useRef(null);

    // Reset form when modal becomes visible/hidden
    useEffect(() => {
        if (isVisible) {
            resetCategoryForm();
            // Focus the name input when modal opens
            setTimeout(() => nameInputRef.current?.focus(), 300);
        }
    }, [isVisible]);

    const resetCategoryForm = useCallback(() => {
        setCategoryName('');
        setCategoryIcon(SUGGESTED_ICONS[0].name);
        setSelectedIconIndex(0);
        setCategoryColor(DEFAULT_CATEGORY_COLORS[0].value);
        setCategoryNameError('');
        setIsLoading(false);
        setCategoryColorModalVisible(false);
        Keyboard.dismiss();
    }, []);

    // --- Input Change Handlers ---
    const handleCategoryNameChange = (text) => {
        setCategoryName(text);
        if (categoryNameError) setCategoryNameError('');
    };

    const handleIconSelection = (iconName, index) => {
        setCategoryIcon(iconName);
        setSelectedIconIndex(index);
    };

    // --- Enhanced Duplicate Name Check with case-insensitive matching ---
    const checkDuplicateCategory = async (name) => {
        if (!user || !name) return true; // Fail safe

        // Normalize the category name: trim whitespace and convert to lowercase for comparison
        const normalizedName = name.trim();
        const lowerCaseName = normalizedName.toLowerCase();

        if (!normalizedName) return true; // Empty name is considered duplicate

        const categoriesRef = collection(firestore, "users", user.uid, "categories");

        try {
            // Get all categories for this user to perform comprehensive checking
            const allCategoriesSnapshot = await getDocs(categoriesRef);

            // Check for any matching category using various field names and case-insensitive comparison
            for (const categoryDoc of allCategoriesSnapshot.docs) {
                const data = categoryDoc.data();

                // Check multiple possible field names that might contain the category name
                const fieldsToCheck = [
                    data.name,
                    data.label,
                    data.Category,
                    data.categoryName
                ];

                for (const fieldValue of fieldsToCheck) {
                    if (fieldValue && typeof fieldValue === 'string') {
                        const normalizedFieldValue = fieldValue.trim().toLowerCase();
                        if (normalizedFieldValue === lowerCaseName) {
                            console.log(`[Modal Category Check] Found existing category: "${fieldValue}" matches "${name}"`);
                            return true; // Duplicate found
                        }
                    }
                }
            }

            console.log(`[Modal Category Check] No existing category found for: "${name}"`);
            return false; // No duplicate found
        } catch (error) {
            console.error("Error checking for duplicate category:", error);
            return true; // Fail safe - assume duplicate on error
        }
    };

    // --- Firebase Save Function ---
    const handleSaveCategory = async () => {
        Keyboard.dismiss();

        if (!user) {
            Alert.alert("Error", "You must be logged in.");
            return;
        }

        let isValid = true;
        const trimmedName = categoryName.trim();

        // Clear previous errors
        setCategoryNameError('');

        if (!validateInput(trimmedName)) {
            setCategoryNameError("Please enter a category name.");
            nameInputRef.current?.focus();
            isValid = false;
        }

        if (!isValid) return;

        setIsLoading(true);

        try {
            // Check for duplicate category name (case-insensitive)
            const isDuplicate = await checkDuplicateCategory(trimmedName);
            if (isDuplicate) {
                setCategoryNameError(`A category with this name already exists.`);
                nameInputRef.current?.focus();
                setIsLoading(false);
                return;
            }

            // Use proper case formatting for consistency
            const properCaseName = trimmedName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');

            const categoryData = {
                userId: user.uid,
                name: properCaseName,          // Primary identifier (properly formatted)
                iconName: categoryIcon,        // Selected icon
                backgroundColor: categoryColor, // Selected color
                createdAt: serverTimestamp(),
                // Extra fields for compatibility with different parts of the app
                label: properCaseName,         // Some code might look for this
                Category: properCaseName,      // For compatibility with HomeScreen
                amount: formatAmount(0),      // Initialize with zero amount
                description: "No spending yet" // Default description
            };

            await addDoc(collection(firestore, "users", user.uid, "categories"), categoryData);
            Alert.alert("Success", "Category added successfully!");
            onClose();
        } catch (error) {
            console.error("Error adding category:", error);
            Alert.alert("Error", `Could not add category. ${error.message}`);
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            resetCategoryForm();
            onClose();
        }
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={handleClose}
            >
                <View style={styles.modalView} onStartShouldSetResponder={() => true}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add New Category</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            disabled={isLoading}
                        >
                            <Ionicons name="close" size={24} color={COLORS.darkGray} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.modalScrollView}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.label}>Category Name *</Text>
                        <TextInput
                            ref={nameInputRef}
                            style={[styles.input, categoryNameError ? styles.inputError : null]}
                            placeholder="e.g., Groceries, Rent"
                            value={categoryName}
                            onChangeText={handleCategoryNameChange}
                            placeholderTextColor={COLORS.gray}
                            returnKeyType="done"
                            maxLength={30}
                        />
                        {categoryNameError ? <Text style={styles.errorText}>{categoryNameError}</Text> : null}

                        <View style={styles.iconSection}>
                            <Text style={styles.label}>Select Category Icon *</Text>
                            <View style={styles.iconsSliderContainer}>
                                <FlatList
                                    data={SUGGESTED_ICONS}
                                    renderItem={({ item, index }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.iconSliderItem,
                                                selectedIconIndex === index && styles.selectedIconItem
                                            ]}
                                            onPress={() => handleIconSelection(item.name, index)}
                                        >
                                            <View style={[
                                                styles.iconBubble,
                                                selectedIconIndex === index && styles.selectedIconBubble
                                            ]}>
                                                <Ionicons name={item.name} size={24} color="#333" />
                                            </View>
                                            <Text style={styles.iconLabel} numberOfLines={1}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={(item, index) => index.toString()}
                                    horizontal={true}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.iconsSlider}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Category Color *</Text>
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => setCategoryColorModalVisible(true)}
                            disabled={isLoading}
                        >
                            <View style={styles.selectButtonContent}>
                                <View style={[styles.colorSwatchInline, { backgroundColor: categoryColor }]} />
                                <Text style={styles.selectButtonText}>
                                    {getLabelFromValue(DEFAULT_CATEGORY_COLORS, categoryColor)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down-outline" size={20} color={COLORS.gray} />
                        </TouchableOpacity>

                        <View style={{ height: 20 }} />
                    </ScrollView>

                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={handleClose}
                            disabled={isLoading}
                        >
                            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton, isLoading && styles.buttonDisabled]}
                            onPress={handleSaveCategory}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={[styles.modalButtonText, styles.saveButtonText]}>Save Category</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>

            <SelectionModal
                isVisible={isCategoryColorModalVisible}
                options={DEFAULT_CATEGORY_COLORS}
                selectedValue={categoryColor}
                onSelect={(value) => {
                    setCategoryColor(value);
                    setCategoryColorModalVisible(false);
                }}
                onClose={() => setCategoryColorModalVisible(false)}
                title="Select Category Color"
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '100%',
        maxHeight: '90%',
        backgroundColor: COLORS.white,
        borderTopLeftRadius: SIZES.radius.large,
        borderTopRightRadius: SIZES.radius.large,
        alignItems: "center",
        ...SHADOWS.medium,
        elevation: 10,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingTop: SIZES.padding.large,
        paddingBottom: SIZES.padding.small,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        right: SIZES.padding.large,
        padding: 8,
    },
    modalTitle: {
        textAlign: "center",
        fontSize: SIZES.h3,
        fontFamily: "Poppins-SemiBold",
        color: COLORS.text,
    },
    modalScrollView: {
        width: '100%',
        paddingHorizontal: SIZES.padding.xlarge,
        marginBottom: SIZES.padding.small,
    },
    label: {
        fontSize: SIZES.font.medium,
        fontFamily: 'Poppins-Medium',
        color: COLORS.darkGray,
        marginBottom: 6,
        alignSelf: 'flex-start',
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelHint: {
        fontSize: SIZES.font.small,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray,
        marginTop: 4,
    },
    helperText: {
        fontSize: SIZES.font.small,
        fontFamily: 'Poppins-Regular',
        color: COLORS.gray,
        marginTop: 4,
        fontStyle: 'italic',
    },
    link: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        width: '100%',
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: SIZES.radius.medium,
        paddingHorizontal: SIZES.padding.medium,
        backgroundColor: COLORS.lightGrayBackground,
    },
    inputIconText: {
        flex: 1,
        fontSize: SIZES.font.large,
        fontFamily: 'Poppins-Regular',
        color: COLORS.text,
        height: '100%',
        paddingVertical: 0,
    },
    input: {
        height: 50,
        width: '100%',
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: SIZES.radius.medium,
        paddingHorizontal: SIZES.padding.medium,
        fontSize: SIZES.font.large,
        fontFamily: 'Poppins-Regular',
        color: COLORS.text,
        backgroundColor: COLORS.lightGrayBackground,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        fontSize: SIZES.font.small,
        fontFamily: 'Poppins-Regular',
        color: COLORS.danger,
        alignSelf: 'flex-start',
        marginTop: 4,
        marginBottom: 4,
    },
    iconSection: {
        marginVertical: 16,
    },
    iconsSliderContainer: {
        backgroundColor: COLORS.lightGrayBackground,
        borderRadius: SIZES.radius.medium,
        padding: 12,
        marginTop: 8,
    },
    iconsSlider: {
        paddingVertical: 4,
    },
    iconSliderItem: {
        width: 80,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    selectedIconItem: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: SIZES.radius.medium,
    },
    iconBubble: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedIconBubble: {
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    iconLabel: {
        fontSize: SIZES.font.small,
        fontFamily: 'Poppins-Medium',
        color: COLORS.darkGray,
        textAlign: 'center',
        maxWidth: '100%',
    },
    selectButton: {
        height: 50,
        width: '100%',
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: SIZES.radius.medium,
        paddingHorizontal: 15,
        backgroundColor: COLORS.lightGrayBackground,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    colorSwatchInline: {
        width: 28,
        height: 28,
        borderRadius: SIZES.radius.small,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        marginRight: 10,
    },
    selectButtonText: {
        fontSize: SIZES.font.large,
        fontFamily: 'Poppins-Regular',
        color: COLORS.text,
    },
    modalButtonContainer: {
        flexDirection: "row",
        justifyContent: 'space-between',
        paddingVertical: SIZES.padding.medium,
        paddingHorizontal: SIZES.padding.xlarge,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        width: '100%',
        backgroundColor: COLORS.white,
    },
    modalButton: {
        borderRadius: SIZES.radius.medium,
        paddingVertical: SIZES.padding.small,
        paddingHorizontal: SIZES.padding.large,
        flex: 1,
        marginHorizontal: SIZES.padding.small,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
    },
    cancelButton: {
        backgroundColor: COLORS.lightGrayBackground,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    modalButtonText: {
        fontFamily: "Poppins-SemiBold",
        textAlign: "center",
        fontSize: SIZES.font.large,
    },
    cancelButtonText: {
        color: COLORS.darkGray,
    },
    saveButtonText: {
        color: COLORS.white,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
});

export default AddCategoryModal;