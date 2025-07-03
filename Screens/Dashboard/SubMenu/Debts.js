import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Alert,
  Platform,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import BackButton from "../../../Components/Buttons/BackButton";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import { COLORS, SIZES, SHADOWS } from "../../../constants/theme";
import { useAuth } from "../../../context/AuthProvider";
import {
  firestore,
  collection,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
} from "../../../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { categorizeAndSortDebts } from "../../../utils/dateUtils";
import { useCurrency } from "../../../contexts/CurrencyContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Dynamic modal sizing and spacing
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 400);
const MODAL_PADDING_H = Math.round(SCREEN_WIDTH * 0.04);
const MODAL_PADDING_V = Math.round(SCREEN_HEIGHT * 0.025);
const MODAL_RADIUS = Math.round(SCREEN_WIDTH * 0.055);

const Debts = ({ navigation, route }) => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const {
    friendId,
    friendName,
    friendEmail,
    avatar,
    type,
    isFavorite = false,
  } = route.params;

  const [debts, setDebts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Store all debts for friend (for passing to DebtDetails)
  const [allFriendDebts, setAllFriendDebts] = useState([]);

  // Animation states for modals
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current;

  // Success modal animations
  const successModalScaleAnim = useRef(new Animated.Value(0)).current;
  const successModalOpacityAnim = useRef(new Animated.Value(0)).current;
  const successBackgroundOpacityAnim = useRef(new Animated.Value(0)).current;

  // Loading modal animations
  const loadingModalScaleAnim = useRef(new Animated.Value(0)).current;
  const loadingModalOpacityAnim = useRef(new Animated.Value(0)).current;
  const loadingBackgroundOpacityAnim = useRef(new Animated.Value(0)).current;

  // Animation functions for account modal
  const openAccountModal = useCallback((debt) => {
    setSelectedDebt(debt);
    setAccountModalVisible(true);

    // Reset animation values
    modalScaleAnim.setValue(0.8);
    modalOpacityAnim.setValue(0);
    backgroundOpacityAnim.setValue(0);

    // Start animations with smoother timing
    Animated.parallel([
      Animated.timing(backgroundOpacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth ease-out
      }),
      Animated.sequence([
        Animated.delay(50), // Small delay for better sequencing
        Animated.parallel([
          Animated.timing(modalOpacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          }),
          Animated.spring(modalScaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 7,
            useNativeDriver: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }),
        ]),
      ]),
    ]).start();
  }, [modalScaleAnim, modalOpacityAnim, backgroundOpacityAnim]);

  const closeAccountModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backgroundOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // Smooth ease-in
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 0.8,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }),
    ]).start(() => {
      setAccountModalVisible(false);
      setSelectedDebt(null);
    });
  }, [modalScaleAnim, modalOpacityAnim, backgroundOpacityAnim]);

  // Animation functions for success modal
  const showSuccessWithAnimation = useCallback((message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);

    // Reset animation values
    successModalScaleAnim.setValue(0.8);
    successModalOpacityAnim.setValue(0);
    successBackgroundOpacityAnim.setValue(0);

    // Start animations
    Animated.parallel([
      Animated.timing(successBackgroundOpacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }),
      Animated.sequence([
        Animated.delay(50),
        Animated.parallel([
          Animated.timing(successModalOpacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          }),
          Animated.spring(successModalScaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 7,
            useNativeDriver: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }),
        ]),
      ]),
    ]).start();

    // Auto-hide after 2.5 seconds and navigate back
    setTimeout(() => {
      hideSuccessWithAnimation();
    }, 2500);
  }, [successModalScaleAnim, successModalOpacityAnim, successBackgroundOpacityAnim, navigation]);

  const hideSuccessWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(successBackgroundOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      }),
      Animated.timing(successModalOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      }),
      Animated.spring(successModalScaleAnim, {
        toValue: 0.8,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }),
    ]).start(() => {
      setShowSuccessModal(false);
      setSuccessMessage("");

      // Navigate back to DebtTracking after animation completes
      navigation.navigate("debtTracking");
    });
  }, [successModalScaleAnim, successModalOpacityAnim, successBackgroundOpacityAnim, navigation]);

  // Animation functions for loading modal
  const showLoadingWithAnimation = useCallback(() => {
    setPaying(true);

    // Reset animation values
    loadingModalScaleAnim.setValue(0.8);
    loadingModalOpacityAnim.setValue(0);
    loadingBackgroundOpacityAnim.setValue(0);

    // Start animations
    Animated.parallel([
      Animated.timing(loadingBackgroundOpacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }),
      Animated.sequence([
        Animated.delay(50),
        Animated.parallel([
          Animated.timing(loadingModalOpacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          }),
          Animated.spring(loadingModalScaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 7,
            useNativeDriver: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }),
        ]),
      ]),
    ]).start();
  }, [loadingModalScaleAnim, loadingModalOpacityAnim, loadingBackgroundOpacityAnim]);

  const hideLoadingWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(loadingBackgroundOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      }),
      Animated.timing(loadingModalOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      }),
      Animated.spring(loadingModalScaleAnim, {
        toValue: 0.8,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }),
    ]).start(() => {
      setPaying(false);
    });
  }, [loadingModalScaleAnim, loadingModalOpacityAnim, loadingBackgroundOpacityAnim]);

  // Real-time fetch debts for this friend (fetch ALL debts, then filter for display)
  useEffect(() => {
    if (!user || !friendId || !type) {
      setDebts([]);
      setAllFriendDebts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const debtsRef = collection(
      firestore,
      "users",
      user.uid,
      "friends",
      friendId,
      "debts"
    );
    const unsub = onSnapshot(debtsRef, (debtsSnap) => {
      if (!debtsSnap || !Array.isArray(debtsSnap.docs)) {
        setDebts([]);
        setAllFriendDebts([]);
        setLoading(false);
        return;
      }

      // Get all debts (for DebtDetails)
      const allDebts = debtsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllFriendDebts(allDebts);

      // Get all unpaid debts (for filtering display)
      const allUnpaidDebts = allDebts.filter((d) => !d.paid);

      // Calculate net amounts to determine which debts to show
      const youOweDebts = allUnpaidDebts.filter((d) => d.type === "Debt");
      const theyOweDebts = allUnpaidDebts.filter((d) => d.type === "Credit");

      const youOweAmount = youOweDebts.reduce((sum, d) => sum + d.amount, 0);
      const theyOweAmount = theyOweDebts.reduce((sum, d) => sum + d.amount, 0);
      const netAmount = youOweAmount - theyOweAmount;

      // Show debts based on the net calculation and the current type
      let debtsToShow = [];
      if (type === "owe" && netAmount > 0) {
        // You owe them (net), show your debt entries
        debtsToShow = youOweDebts;
      } else if (type === "owed" && netAmount < 0) {
        // They owe you (net), show their debt entries
        debtsToShow = theyOweDebts;
      }
      // If net amount is 0 or wrong type, show empty array

      // Sort debts properly: overdue first, then due today, then upcoming
      if (debtsToShow.length > 0) {
        const categorizedDebts = categorizeAndSortDebts(debtsToShow);
        // Create a prioritized list: overdue first, then due today, then upcoming
        const sortedDebts = [
          ...categorizedDebts.overdue,
          ...categorizedDebts.dueToday,
          ...categorizedDebts.upcoming
        ];
        setDebts(sortedDebts);
      } else {
        setDebts([]);
      }

      setLoading(false);
    });

    return () => unsub();
  }, [user, friendId, type]);

  // Fetch accounts for modal (no need for real-time here)
  useEffect(() => {
    if (!user) return;
    const fetchAccounts = async () => {
      const accountsRef = collection(firestore, "users", user.uid, "accounts");
      const snap = await getDocs(accountsRef);
      setAccounts(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    };
    fetchAccounts();
  }, [user]);

  // Pay or receive a specific debt
  const handlePayOrReceive = (debt) => {
    openAccountModal(debt);
  };

  const handleAccountChoose = async (account) => {
    closeAccountModal();
    showLoadingWithAnimation();

    try {
      // Validate account balance for payments (when you owe)
      if (type === "owe") {
        const currentBalance = Number(account.currentBalance) || 0;
        if (currentBalance < selectedDebt.amount) {
          Alert.alert(
            "Insufficient Funds",
            `Your account "${account.title}" has a balance of ${formatAmount(currentBalance)}, but you need ${formatAmount(selectedDebt.amount)} to pay this debt.`,
            [{ text: "OK" }]
          );
          hideLoadingWithAnimation();
          return;
        }
      }

      // Mark debt as paid in Firestore
      const debtDocRef = doc(
        firestore,
        "users",
        user.uid,
        "friends",
        friendId,
        "debts",
        selectedDebt.id
      );
      await updateDoc(debtDocRef, { paid: true });

      // Update account balance
      const accountDocRef = doc(
        firestore,
        "users",
        user.uid,
        "accounts",
        account.id
      );
      if (type === "owe") {
        // You pay: subtract from your account
        await updateDoc(accountDocRef, {
          currentBalance: increment(-selectedDebt.amount),
        });
      } else {
        // Someone pays you: add to your account
        await updateDoc(accountDocRef, {
          currentBalance: increment(selectedDebt.amount),
        });
      }

      // Create transaction record for audit trail
      const transactionData = {
        accountId: account.id,
        accountName: account.title,
        amount: selectedDebt.amount,
        type: type === "owe" ? "Expenses" : "Income",
        category: type === "owe" ? "Debt Payment" : "Debt Collection",
        description: type === "owe"
          ? `Debt payment to ${friendName}${selectedDebt.description ? ` - ${selectedDebt.description}` : ''}`
          : `Debt collection from ${friendName}${selectedDebt.description ? ` - ${selectedDebt.description}` : ''}`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        addedVia: 'debt-management',
        debtId: selectedDebt.id,
        friendId: friendId,
        friendName: friendName
      };

      // Add transaction to Firestore
      await addDoc(collection(firestore, "users", user.uid, "transactions"), transactionData);

      const message = type === "owe"
        ? `Debt of ${formatAmount(selectedDebt.amount)} paid from "${account.title}"!`
        : `Payment of ${formatAmount(selectedDebt.amount)} received to "${account.title}"!`;

      hideLoadingWithAnimation();
      showSuccessWithAnimation(message);
    } catch (err) {
      console.error("Error processing payment:", err);
      hideLoadingWithAnimation();
      Alert.alert(
        "Error",
        "Could not process payment. Please check your internet connection and try again."
      );
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  // View Details handler: Pass ALL debts for this friend and friend info
  const handleViewDetails = () => {
    navigation.navigate("DebtDetails", {
      friend: {
        avatar,
        name: friendName,
        email: friendEmail,
        id: friendId,
        isFavorite: isFavorite,
      },
      debts: allFriendDebts, // Pass all debts, not just filtered ones
      type, // Add the missing type parameter
    });
  };

  // Use your provided icon mapping
  const getAccountTypeIcon = (type) => {
    switch (type) {
      case "balance":
        return "wallet-sharp";
      case "income_tracker":
        return "stats-chart";
      case "savings_goal":
        return "trophy";
      default:
        return "wallet-sharp";
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.title}>
            {type === "owe" ? "Pay Debts" : "Receive Payments"}
          </Text>
        </View>
        <Text style={styles.infoText}>
          {type === "owe"
            ? "Below are unpaid debts you owe to this contact. Tap to pay."
            : "Below are unpaid debts this contact owes you. Tap to receive."}
        </Text>
        {/* View Details Button (shows at the top for this friend) */}
        <View style={styles.detailsButtonContainer}>
          <TouchableOpacity
            onPress={handleViewDetails}
            style={styles.detailsButton}
            activeOpacity={0.8}
          >
            <View style={styles.detailsButtonContent}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={COLORS.primary}
                style={styles.detailsButtonIcon}
              />
              <Text style={styles.detailsButtonText}>View Details</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.primary}
                style={styles.detailsButtonChevron}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Separator Line */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
        </View>

        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 32 }}
            size="large"
            color={COLORS.primary}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {debts.length === 0 ? (
              <Text
                style={{ color: "#888", textAlign: "center", marginTop: 30 }}
              >
                No unpaid {type === "owe" ? "debts" : "credits"} for this
                contact!
              </Text>
            ) : (
              debts.map((debt) => (
                <View
                  key={debt.id}
                  style={{
                    marginBottom: SIZES.padding.medium,
                    opacity: paying ? 0.5 : 1
                  }}
                >
                  <FriendCard
                    avatar={avatar}
                    name={friendName}
                    email={friendEmail}
                    debtAmount={debt.amount}
                    dueDate={debt.dueDate}
                    youOwe={type === "owe"}
                    isFavorite={isFavorite}
                    onPress={paying ? undefined : () => handlePayOrReceive(debt)}
                  />
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Account selection modal */}
        <Modal visible={accountModalVisible && !paying} transparent animationType="none">
          <TouchableWithoutFeedback onPress={closeAccountModal}>
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: backgroundOpacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'],
                }),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableWithoutFeedback onPress={() => { }}>
                <Animated.View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: MODAL_RADIUS,
                    width: MODAL_WIDTH,
                    paddingHorizontal: MODAL_PADDING_H,
                    paddingTop: MODAL_PADDING_V + 10,
                    paddingBottom: MODAL_PADDING_V,
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 8,
                    maxHeight: SCREEN_HEIGHT * 0.8,
                    transform: [
                      {
                        scale: modalScaleAnim.interpolate({
                          inputRange: [0, 0.8, 1],
                          outputRange: [0.7, 0.95, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                      {
                        translateY: modalScaleAnim.interpolate({
                          inputRange: [0, 0.8, 1],
                          outputRange: [50, 10, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                    opacity: modalOpacityAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 0.8, 1],
                      extrapolate: 'clamp',
                    }),
                  }}
                >
                  <Animated.View
                    style={{
                      opacity: modalOpacityAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.3, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [{
                        translateY: modalOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                          extrapolate: 'clamp',
                        }),
                      }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Math.round(SCREEN_WIDTH * 0.045),
                        fontFamily: "Poppins-SemiBold",
                        marginBottom: Math.round(SCREEN_HEIGHT * 0.015),
                        textAlign: "center",
                        color: "#111",
                      }}
                    >
                      Select account{" "}
                      {type === "owe" ? "to pay from" : "to receive to"}:
                    </Text>
                  </Animated.View>

                  {selectedDebt && (
                    <Animated.View
                      style={{
                        backgroundColor: "#F8F9FA",
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 16,
                        borderLeftWidth: 4,
                        borderLeftColor: type === "owe" ? "#FF6B6B" : "#4ECDC4",
                        opacity: modalOpacityAnim.interpolate({
                          inputRange: [0, 0.6, 1],
                          outputRange: [0, 0.5, 1],
                          extrapolate: 'clamp',
                        }),
                        transform: [{
                          translateY: modalOpacityAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [15, 0],
                            extrapolate: 'clamp',
                          }),
                        }],
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        color: "#555",
                        fontFamily: "Poppins-Regular",
                        textAlign: "center"
                      }}>
                        {type === "owe" ? "Paying" : "Receiving"}: <Text style={{ fontWeight: "bold", color: "#111" }}>{formatAmount(selectedDebt.amount)}</Text>
                      </Text>
                      {selectedDebt.description && (
                        <Text style={{
                          fontSize: 12,
                          color: "#777",
                          fontFamily: "Poppins-Regular",
                          textAlign: "center",
                          marginTop: 4
                        }}>
                          {selectedDebt.description}
                        </Text>
                      )}
                    </Animated.View>
                  )}

                  <Animated.View
                    style={{
                      opacity: modalOpacityAnim.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0, 0.6, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [{
                        translateY: modalOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, 0],
                          extrapolate: 'clamp',
                        }),
                      }],
                    }}
                  >
                    {accounts.map((acc) => {
                      const currentBalance = Number(acc.currentBalance) || 0;
                      const hasInsufficientFunds = type === "owe" && selectedDebt && currentBalance < selectedDebt.amount;

                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 12,
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: "#F3F4F6",
                            borderRadius: 10,
                            marginBottom: 2,
                            backgroundColor: hasInsufficientFunds ? "#FFF2F2" : "#fff",
                            opacity: hasInsufficientFunds ? 0.7 : 1,
                          }}
                          onPress={() => handleAccountChoose(acc)}
                          disabled={paying || hasInsufficientFunds}
                        >
                          <Ionicons
                            name={getAccountTypeIcon(acc.type)}
                            size={22}
                            color={hasInsufficientFunds ? "#999" : "#222"}
                            style={{ marginRight: 14 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 16,
                              color: hasInsufficientFunds ? "#999" : "#111",
                              fontFamily: "Poppins-Regular"
                            }}>
                              {acc.title}
                            </Text>
                            {hasInsufficientFunds && (
                              <Text style={{
                                fontSize: 12,
                                color: "#FF6B6B",
                                fontFamily: "Poppins-Regular",
                                marginTop: 2
                              }}>
                                Insufficient funds
                              </Text>
                            )}
                          </View>
                          <Text style={{
                            fontSize: 15,
                            color: hasInsufficientFunds ? "#FF6B6B" : "#888",
                            fontFamily: "Poppins-Regular",
                            fontWeight: hasInsufficientFunds ? "600" : "normal"
                          }}>
                            {formatAmount(currentBalance)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Animated.View>

                  <Animated.View
                    style={{
                      opacity: modalOpacityAnim.interpolate({
                        inputRange: [0, 0.8, 1],
                        outputRange: [0, 0.7, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [{
                        translateY: modalOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [5, 0],
                          extrapolate: 'clamp',
                        }),
                      }],
                    }}
                  >
                    <TouchableOpacity
                      onPress={closeAccountModal}
                      disabled={paying}
                      style={{
                        marginTop: Math.round(SCREEN_HEIGHT * 0.02),
                        alignSelf: "center",
                        backgroundColor: "#fff",
                        borderRadius: Math.round(SCREEN_WIDTH * 0.03),
                        paddingHorizontal: Math.round(SCREEN_WIDTH * 0.08),
                        paddingVertical: Math.round(SCREEN_HEIGHT * 0.015),
                        borderWidth: 1,
                        borderColor: "#ddd",
                      }}
                    >
                      <Text style={{
                        color: "#111",
                        fontSize: Math.round(SCREEN_WIDTH * 0.04),
                        fontFamily: "Poppins-SemiBold"
                      }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Success Modal */}
        <Modal
          transparent={true}
          visible={showSuccessModal}
          animationType="none"
          onRequestClose={hideSuccessWithAnimation}
        >
          <TouchableWithoutFeedback onPress={hideSuccessWithAnimation}>
            <Animated.View
              style={{
                flex: 1,
                backgroundColor: successBackgroundOpacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'],
                }),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableWithoutFeedback onPress={() => { }}>
                <Animated.View
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: MODAL_RADIUS,
                    width: MODAL_WIDTH,
                    paddingHorizontal: MODAL_PADDING_H,
                    paddingTop: MODAL_PADDING_V + 10,
                    paddingBottom: MODAL_PADDING_V,
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 8,
                    transform: [
                      {
                        scale: successModalScaleAnim.interpolate({
                          inputRange: [0, 0.8, 1],
                          outputRange: [0.7, 0.95, 1],
                          extrapolate: 'clamp',
                        }),
                      },
                      {
                        translateY: successModalScaleAnim.interpolate({
                          inputRange: [0, 0.8, 1],
                          outputRange: [50, 10, 0],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                    opacity: successModalOpacityAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 0.8, 1],
                      extrapolate: 'clamp',
                    }),
                  }}
                >
                  <Animated.View
                    style={{
                      opacity: successModalOpacityAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0.3, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [{
                        translateY: successModalOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                          extrapolate: 'clamp',
                        }),
                      }],
                    }}
                  >
                    <Text style={{
                      fontSize: Math.round(SCREEN_WIDTH * 0.05),
                      fontFamily: "Poppins-Bold",
                      marginBottom: Math.round(SCREEN_HEIGHT * 0.02),
                      color: COLORS.primary,
                      textAlign: "center",
                    }}>
                      Success!
                    </Text>
                  </Animated.View>

                  <Animated.View
                    style={{
                      opacity: successModalOpacityAnim.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [0, 0.5, 1],
                        extrapolate: 'clamp',
                      }),
                      transform: [{
                        translateY: successModalOpacityAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [15, 0],
                          extrapolate: 'clamp',
                        }),
                      }],
                    }}
                  >
                    <Text style={{
                      fontSize: Math.round(SCREEN_WIDTH * 0.04),
                      textAlign: "center",
                      lineHeight: 20,
                      color: COLORS.textSecondary,
                      fontFamily: "Poppins-Regular",
                      marginBottom: Math.round(SCREEN_HEIGHT * 0.015),
                    }}>
                      {successMessage}
                    </Text>
                    <Text style={{
                      fontSize: Math.round(SCREEN_WIDTH * 0.035),
                      textAlign: "center",
                      color: COLORS.textSecondary,
                      fontFamily: "Poppins-Regular",
                      opacity: 0.7,
                    }}>
                      Tap to continue
                    </Text>
                  </Animated.View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Loading Modal */}
        <Modal
          transparent={true}
          visible={paying}
          animationType="none"
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: loadingBackgroundOpacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)'],
              }),
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                backgroundColor: COLORS.white,
                borderRadius: MODAL_RADIUS,
                width: MODAL_WIDTH,
                paddingHorizontal: MODAL_PADDING_H,
                paddingTop: MODAL_PADDING_V + 10,
                paddingBottom: MODAL_PADDING_V,
                alignItems: "center",
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 2 },
                elevation: 8,
                transform: [
                  {
                    scale: loadingModalScaleAnim.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [0.7, 0.95, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    translateY: loadingModalScaleAnim.interpolate({
                      inputRange: [0, 0.8, 1],
                      outputRange: [50, 10, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
                opacity: loadingModalOpacityAnim.interpolate({
                  inputRange: [0, 0.3, 1],
                  outputRange: [0, 0.8, 1],
                  extrapolate: 'clamp',
                }),
              }}
            >
              <Animated.View
                style={{
                  opacity: loadingModalOpacityAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.3, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: loadingModalOpacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                      extrapolate: 'clamp',
                    }),
                  }],
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={COLORS.primary}
                  style={{ marginBottom: Math.round(SCREEN_HEIGHT * 0.02) }}
                />
              </Animated.View>

              <Animated.View
                style={{
                  opacity: loadingModalOpacityAnim.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0, 0.5, 1],
                    extrapolate: 'clamp',
                  }),
                  transform: [{
                    translateY: loadingModalOpacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                      extrapolate: 'clamp',
                    }),
                  }],
                }}
              >
                <Text style={{
                  fontSize: Math.round(SCREEN_WIDTH * 0.05),
                  fontFamily: "Poppins-Bold",
                  marginBottom: Math.round(SCREEN_HEIGHT * 0.02),
                  color: COLORS.primary,
                  textAlign: "center",
                }}>
                  Processing Payment...
                </Text>
                <Text style={{
                  fontSize: Math.round(SCREEN_WIDTH * 0.04),
                  textAlign: "center",
                  lineHeight: 20,
                  color: COLORS.textSecondary,
                  fontFamily: "Poppins-Regular",
                }}>
                  {type === "owe"
                    ? "Paying your debt, please wait..."
                    : "Processing payment receipt, please wait..."
                  }
                </Text>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  title: {
    fontSize: SIZES.font.xlarge,
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  infoText: {
    textAlign: "left",
    fontSize: SIZES.font.medium,
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
    fontFamily: "Poppins-Regular",
  },
  scrollContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    paddingBottom: SIZES.padding.xxlarge,
    paddingTop: SIZES.padding.xlarge,
  },
  detailsButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginTop: SIZES.padding.large,
  },
  detailsButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary + '90', // 20% opacity
    ...SHADOWS.large,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  detailsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsButtonIcon: {
    marginRight: 8,
  },
  detailsButtonText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  detailsButtonChevron: {
    marginLeft: 6,
    opacity: 0.8,
  },
  separatorContainer: {
    marginTop: SIZES.padding.medium,
    // marginBottom: SIZES.padding.large,
    paddingHorizontal: SIZES.padding.xxlarge,
  },
  separatorLine: {
    height: 1,
    backgroundColor: COLORS.lightGray || '#E5E7EB',
    // opacity: 0.6,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 0.5,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
});

export default Debts;