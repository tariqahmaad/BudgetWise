import React, { useMemo, useState, useEffect, useRef } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Alert,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, SHADOWS } from "../../constants/theme";
import {
    doc,
    writeBatch,
} from "firebase/firestore";
import { cleanupEmptyCategories } from "../../services/transactionService";
import { useCurrency } from "../../contexts/CurrencyContext";

// formatCurrency moved inside component to access currency context

const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    // Handle different timestamp formats
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }

    // Handle date string
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (!isNaN(date)) {
            return date.toLocaleDateString();
        }
    }

    // Handle Date object
    if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
    }

    return "Invalid Date";
};

const DeleteAccountConfirmationModal = ({
    isVisible,
    onClose,
    onSuccess,
    account,
    linkedTransactions,
    user,
    firestore,
}) => {
    const { formatAmount } = useCurrency();
    const [isDeleting, setIsDeleting] = useState(false);
    const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);

    // Memoized transaction item component with currency context
    const TransactionItem = React.memo(({ item, isLast }) => (
        <View style={[styles.transactionItem, isLast && styles.lastTransactionItem]}>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription} numberOfLines={2}>
                    {item.description || item.category || "No Description"}
                </Text>
                <Text style={styles.transactionDate}>
                    {formatDate(item.date || item.createdAt)}
                </Text>
            </View>
            <Text style={styles.transactionAmount}>
                {formatAmount(item.amount)}
            </Text>
        </View>
    ));

    // Animation refs
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const modalTranslateY = useRef(new Animated.Value(500)).current;

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenHeight(window.height);
        });

        return () => subscription?.remove();
    }, []);

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

    // Memoize the transactions to display for performance
    const transactionsToShow = useMemo(() => {
        // linkedTransactions can be undefined on first render, so we guard against that
        return (linkedTransactions || []).slice(0, 100); // Show up to 100 transactions
    }, [linkedTransactions]);

    // All hooks must be called before any conditional return to avoid React errors.
    if (!account) {
        return null;
    }

    const handleClose = () => {
        if (!isDeleting) {
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
        }
    };

    const handleDelete = async () => {
        if (!user || isDeleting) return;

        try {
            setIsDeleting(true);
            const batch = writeBatch(firestore);

            // Delete all linked transactions
            linkedTransactions.forEach((transaction) => {
                const transactionRef = doc(firestore, "users", user.uid, "transactions", transaction.id);
                batch.delete(transactionRef);
            });

            // Delete the account itself
            const accountRef = doc(firestore, "users", user.uid, "accounts", account.id);
            batch.delete(accountRef);

            await batch.commit();

            // Clean up any empty categories after deleting transactions
            try {
                await cleanupEmptyCategories(user.uid);
                console.log('[Account Delete] Category cleanup completed');
            } catch (cleanupError) {
                console.error('[Account Delete] Error during category cleanup:', cleanupError);
                // Don't let cleanup errors affect the main deletion flow
            }

            Alert.alert(
                "Success",
                "Account and all linked transactions deleted successfully!",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            // Animate modal out smoothly after success
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
                                if (onSuccess) onSuccess();
                            });
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Error deleting account and transactions:", error);
            Alert.alert("Error", "Failed to delete account. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const renderTransactionItem = ({ item, index }) => {
        // Only consider it the last item if there's no footer OR it's actually the last transaction
        const isLastItem = index === transactionsToShow.length - 1 && linkedTransactions.length <= 100;

        return (
            <TransactionItem
                item={item}
                isLast={isLastItem}
            />
        );
    };

    const renderListFooter = () => {
        if (linkedTransactions.length > 100) {
            return (
                <View style={styles.moreTransactionsItem}>
                    <Text style={styles.moreTransactionsText}>
                        ... and {linkedTransactions.length - 100} more transactions
                    </Text>
                </View>
            );
        }
        return null; // Remove the extra View with height
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={isVisible}
            onRequestClose={handleClose}
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
                    onPress={handleClose}
                />
                <Animated.View
                    style={[
                        styles.modalView,
                        {
                            height: Math.min(600, screenHeight * 0.8),
                            transform: [{ translateY: modalTranslateY }]
                        }
                    ]}
                    onStartShouldSetResponder={() => true}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isDeleting}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Delete Account</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <View style={styles.warningSection}>
                        <View style={styles.warningHeader}>
                            <Ionicons
                                name="warning"
                                size={24}
                                color={COLORS.danger}
                                style={styles.warningIcon}
                            />
                            <Text style={styles.warningTitle}>Warning</Text>
                        </View>
                        <Text style={styles.accountName}>
                            You are about to delete "{account.title}".
                        </Text>
                        <Text style={styles.warningText}>
                            This will permanently delete the account and all of its{" "}
                            {linkedTransactions.length} associated transactions. This action
                            cannot be undone.
                        </Text>
                    </View>

                    {linkedTransactions.length > 0 && (
                        <View style={styles.transactionSection}>
                            <Text style={styles.transactionListHeader}>
                                Transactions to be deleted ({linkedTransactions.length}):
                            </Text>
                            <View style={styles.transactionListContainer}>
                                <FlatList
                                    data={transactionsToShow}
                                    renderItem={renderTransactionItem}
                                    keyExtractor={(item) => item.id}
                                    ListFooterComponent={renderListFooter}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                    removeClippedSubviews={false}
                                    maxToRenderPerBatch={15}
                                    windowSize={10}
                                    initialNumToRender={8}
                                />
                            </View>
                        </View>
                    )}

                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={handleClose}
                            disabled={isDeleting}
                        >
                            <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButton, isDeleting && styles.buttonDisabled]}
                            onPress={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color={COLORS.white} />
                            ) : (
                                <Text style={[styles.modalButtonText, styles.deleteButtonText]}>
                                    Delete Permanently
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    modalView: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 15,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F7",
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: "Poppins-SemiBold",
        color: "#000",
    },
    closeButton: {
        padding: 4,
    },
    placeholder: {
        width: 32,
    },
    warningSection: {
        backgroundColor: "#FFF4F4",
        borderRadius: SIZES.radius.medium,
        padding: SIZES.padding.medium,
        margin: SIZES.padding.medium,
        borderWidth: 1,
        borderColor: "#FFE5E5",
        width: "90%",
    },
    warningHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SIZES.padding.small,
    },
    warningIcon: {
        marginRight: 8,
    },
    warningTitle: {
        fontSize: SIZES.font.large,
        fontFamily: "Poppins-SemiBold",
        color: COLORS.danger,
    },
    accountName: {
        fontSize: SIZES.font.medium,
        fontFamily: "Poppins-SemiBold",
        color: "#000",
        marginBottom: 8,
    },
    warningText: {
        fontSize: SIZES.font.medium,
        fontFamily: "Poppins-Regular",
        color: COLORS.darkGray,
        lineHeight: 20,
    },
    transactionSection: {
        flex: 1,
        width: "100%",
        paddingHorizontal: SIZES.padding.medium,
    },
    transactionListHeader: {
        fontSize: SIZES.font.medium,
        fontFamily: "Poppins-SemiBold",
        color: "#000",
        marginBottom: SIZES.padding.small,
    },
    transactionListContainer: {
        flex: 1,
        backgroundColor: "#FAFAFA",
        borderRadius: SIZES.radius.medium,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        overflow: "hidden",
    },
    transactionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: SIZES.padding.medium,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5EA",
        height: 70,
    },
    lastTransactionItem: {
        borderBottomWidth: 0,
    },
    transactionDetails: {
        flex: 1,
        marginRight: SIZES.padding.small,
        justifyContent: "center",
    },
    transactionDescription: {
        fontSize: SIZES.font.medium,
        fontFamily: "Poppins-Medium",
        color: "#000",
        marginBottom: 4,
        lineHeight: 18,
    },
    transactionDate: {
        fontSize: SIZES.font.small,
        fontFamily: "Poppins-Regular",
        color: "#666",
    },
    transactionAmount: {
        fontSize: SIZES.font.medium,
        fontFamily: "Poppins-SemiBold",
        color: COLORS.primary,
        textAlign: "right",
        minWidth: 80,
    },
    moreTransactionsItem: {
        paddingVertical: SIZES.padding.medium,
        paddingHorizontal: SIZES.padding.medium,
        alignItems: "center",
        backgroundColor: "#F0F0F0",
        borderTopWidth: 1,
        borderTopColor: "#E5E5EA",
    },
    moreTransactionsText: {
        fontSize: SIZES.font.small,
        fontFamily: "Poppins-Medium",
        color: "#666",
        fontStyle: "italic",
    },
    modalButtonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: SIZES.padding.medium,
        paddingHorizontal: SIZES.padding.xlarge,
        borderTopWidth: 1,
        borderTopColor: "#F2F2F7",
        width: "100%",
        backgroundColor: COLORS.white,
    },
    modalButton: {
        borderRadius: SIZES.radius.medium,
        paddingVertical: SIZES.padding.small,
        paddingHorizontal: SIZES.padding.large,
        flex: 1,
        marginHorizontal: SIZES.padding.small,
        alignItems: "center",
        justifyContent: "center",
        height: 48,
        minHeight: 48,
    },
    cancelButton: {
        backgroundColor: COLORS.lightGrayBackground,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 2,
        borderColor: "#E53E3E",
    },
    modalButtonText: {
        fontFamily: "Poppins-SemiBold",
        textAlign: "center",
        fontSize: SIZES.font.large,
    },
    cancelButtonText: {
        color: COLORS.darkGray,
    },
    deleteButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default DeleteAccountConfirmationModal; 