// Components/SelectionModal.js
import React, { useCallback, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Dimensions,
    Platform,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const { height } = Dimensions.get('window');

// Wrap component with React.memo for performance optimization
const SelectionModal = React.memo(({ isVisible, options, selectedValue, onSelect, onClose, title }) => {

    // Animation refs
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const modalTranslateY = useRef(new Animated.Value(500)).current;

    useEffect(() => {
        if (isVisible) {
            // Animate modal in
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(modalTranslateY, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Reset animation values when modal becomes invisible
            backdropOpacity.setValue(0);
            modalTranslateY.setValue(500);
        }
    }, [isVisible, backdropOpacity, modalTranslateY]);

    const handleClose = () => {
        // Animate modal out
        Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(modalTranslateY, {
                toValue: 500,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    // Wrap renderItem with useCallback to optimize FlatList performance
    const renderItem = useCallback(({ item }) => {
        const isSelected = item.value === selectedValue;
        // Ensure label is a string for display and accessibility
        const itemLabel = typeof item.label === 'string' ? item.label : String(item.value);

        return (
            <TouchableOpacity
                style={[styles.optionButton, isSelected && styles.selectedOption]}
                onPress={() => {
                    onSelect(item.value);
                    // Decide whether to close the modal immediately upon selection:
                    handleClose(); // <-- Use animated close instead of direct onClose
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={itemLabel}
            >
                {title?.toLowerCase().includes('color') && item.value ? (
                    <View
                        style={[styles.colorSwatch, { backgroundColor: item.value }]}
                        accessibilityLabel={`Color swatch for ${itemLabel}`}
                    />
                ) : null}
                <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                    {itemLabel}
                </Text>
                {isSelected && (
                    <Ionicons
                        name="checkmark-circle"
                        size={SIZES.inputIcon} // Use SIZES.inputIcon
                        color={COLORS.primary}
                        accessibilityLabel="Selected"
                    />
                )}
            </TouchableOpacity>
        );
    }, [selectedValue, onSelect, title, handleClose]); // Updated dependencies

    // Constant for close button size
    const CLOSE_BUTTON_SIZE = 28; // Keep specific size as it's not directly in SIZES

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
            statusBarTranslucent={true} // Match DropUpMenu behaviour
        >
            <Animated.View
                style={[
                    styles.modalOverlay,
                    { opacity: backdropOpacity }
                ]}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose} // Close when tapping outside
                    accessibilityLabel="Close modal"
                    accessibilityRole="button"
                />
                {/* SafeAreaView ensures content avoids notches/system areas */}
                <SafeAreaView style={styles.safeArea}>
                    {/* Use View and onStartShouldSetResponder to prevent taps inside closing the modal */}
                    <Animated.View
                        style={[
                            styles.modalContent,
                            { transform: [{ translateY: modalTranslateY }] }
                        ]}
                        onStartShouldSetResponder={() => true} // Prevents taps bubbling to overlay
                    >
                        <View style={styles.header}>
                            <Text style={styles.modalTitle}>{title || 'Select an Option'}</Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={CLOSE_BUTTON_SIZE} // Use defined size
                                    color={COLORS.gray} // Use standard gray
                                />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={options}
                            renderItem={renderItem}
                            keyExtractor={(item) => String(item.value)} // Ensure value is string/unique for key
                            style={styles.list}
                        // Optional optimizations for long lists:
                        // removeClippedSubviews={Platform.OS === 'android'} // Might improve Android perf
                        // initialNumToRender={15} // Adjust based on typical list size
                        // maxToRenderPerBatch={10}
                        // windowSize={10}
                        />
                    </Animated.View>
                </SafeAreaView>
            </Animated.View>
        </Modal>
    );
});

// Optional: Define PropTypes for better development experience
// SelectionModal.propTypes = { ... };

const CLOSE_BUTTON_SIZE = 28; // Define size constant for calculations

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // More subtle backdrop
    },
    safeArea: {
        backgroundColor: 'transparent', // Ensure safe area doesn't have its own background
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20, // More modern radius
        borderTopRightRadius: 20, // More modern radius
        paddingHorizontal: SIZES.padding.xlarge, // Use SIZES.padding.xlarge
        paddingTop: SIZES.padding.xlarge, // Use SIZES.padding.xlarge
        paddingBottom: SIZES.padding.xxlarge, // Use SIZES.padding.xxlarge for bottom spacing
        maxHeight: height * 0.6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 15, // Better elevation for Android
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider, // Use COLORS.divider
        paddingBottom: SIZES.padding.medium, // Use SIZES.padding.medium
        marginBottom: SIZES.padding.medium, // Use SIZES.padding.medium
    },
    modalTitle: {
        fontSize: 18, // Keep specific size for now, or adjust if a SIZES.font matches
        fontFamily: 'Poppins-SemiBold', // Use direct font name
        color: COLORS.text,
        flex: 1,
        textAlign: 'center',
        // Adjust margin based on close button size/padding
        marginLeft: CLOSE_BUTTON_SIZE + (SIZES.padding.medium * 2), // Offset for close button area
    },
    closeButton: {
        padding: SIZES.padding.medium, // Use padding for touchable area
        position: 'absolute',
        right: SIZES.padding.xlarge - SIZES.padding.medium, // Align based on parent padding
        // Calculate top position to roughly center vertically within header padding area
        top: (SIZES.padding.xlarge / 2) - (SIZES.padding.medium / 2) - (CLOSE_BUTTON_SIZE / 2) + (SIZES.padding.medium / 2),
    },
    list: {
        // Styles for the list container if needed
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.padding.large, // Use SIZES.padding.large
        paddingHorizontal: SIZES.padding.medium, // Use SIZES.padding.medium
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider, // Use COLORS.divider
    },
    selectedOption: {
        // backgroundColor: COLORS.lightPrimary, // Optional highlight - lightPrimary doesn't exist, maybe dilute COLORS.primary?
    },
    optionText: {
        flex: 1,
        fontSize: SIZES.font.large, // Use SIZES.font.large
        fontFamily: 'Poppins-Regular', // Use direct font name
        color: COLORS.text,
        marginRight: SIZES.padding.medium, // Use SIZES.padding.medium
    },
    selectedOptionText: {
        fontFamily: 'Poppins-SemiBold', // Use direct font name
        color: COLORS.primary,
    },
    colorSwatch: {
        width: SIZES.inputIcon, // Use SIZES.inputIcon
        height: SIZES.inputIcon, // Use SIZES.inputIcon
        borderRadius: 4, // Keep specific radius for small swatch
        marginRight: SIZES.padding.medium, // Use SIZES.padding.medium
        borderWidth: 1,
        borderColor: COLORS.divider, // Use COLORS.divider
    },
    // --- Optional Done Button Styles (if re-enabled) ---
    // modalButtonContainer: { ... },
    // doneButton: { ... },
    // doneButtonText: { ... },
});

export default SelectionModal;