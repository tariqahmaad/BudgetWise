import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, Platform, Modal, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert, Animated, Easing } from "react-native";
import * as Haptics from 'expo-haptics';
import BackButton from "../../../Components/Buttons/BackButton";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import ScreenWrapper from "../../../Components/ScreenWrapper";
const plantImage = require("../../../assets/debt-details.png");
import { COLORS, FONTS, SIZES } from "../../../constants/theme";
import { useAuth } from "../../../context/AuthProvider";
import {
  firestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
} from "../../../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Dynamic modal sizing and spacing
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 400);
const MODAL_PADDING_H = Math.round(SCREEN_WIDTH * 0.04);
const MODAL_PADDING_V = Math.round(SCREEN_HEIGHT * 0.025);
const MODAL_RADIUS = Math.round(SCREEN_WIDTH * 0.055);

function formatDate(dateStr) {
  if (!dateStr) return "No date";

  try {
    const date = new Date(dateStr);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Error formatting date:", dateStr, error);
    return "Invalid date";
  }
}

// Helper function to normalize dates for consistent comparison
function normalizeDate(date) {
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

// Helper function to check if a debt is overdue
function isDebtOverdue(dueDate) {
  if (!dueDate) return false;
  const today = normalizeDate(new Date());
  const dueDateNormalized = normalizeDate(dueDate);
  return dueDateNormalized < today;
}

// Helper function to categorize and sort debts properly
function categorizeAndSortDebts(debts) {
  if (!debts || debts.length === 0) return { overdue: [], dueToday: [], upcoming: [] };

  const today = normalizeDate(new Date());
  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  debts.forEach(debt => {
    // Validate debt object
    if (!debt || typeof debt.amount !== 'number' || debt.amount <= 0) {
      console.warn("Invalid debt object:", debt);
      return;
    }

    const dueDate = normalizeDate(debt.dueDate);
    if (!dueDate) {
      // If no due date, treat as upcoming with low priority
      upcoming.push(debt);
      return;
    }

    if (dueDate < today) {
      overdue.push(debt);
    } else if (dueDate.getTime() === today.getTime()) {
      dueToday.push(debt);
    } else {
      upcoming.push(debt);
    }
  });

  // Sort each category by due date (oldest first for overdue, earliest first for others)
  const sortByDueDate = (a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);

    // Handle invalid dates
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;

    return dateA - dateB;
  };

  overdue.sort(sortByDueDate);
  dueToday.sort(sortByDueDate);
  upcoming.sort(sortByDueDate);

  return { overdue, dueToday, upcoming };
}

// Helper function to format amounts compactly for badges
function formatBadgeAmount(amount) {
  return `$${amount.toFixed(0)}`;
}

const DebtDetails = ({ navigation, route }) => {
  const { user } = useAuth();
  const { friend, debts, type } = route.params;

  // State management
  const [accounts, setAccounts] = useState([]);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paying, setPaying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("send"); // New state for tab switching

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

  // Tab switch animations
  const tabSwitchAnim = useRef(new Animated.Value(0)).current;

  // Fetch accounts for modal
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

  // Animate tab switch
  const animateTabSwitch = useCallback((newTab) => {
    setActiveTab(newTab);

    // Quick pulse animation for visual feedback
    Animated.sequence([
      Animated.timing(tabSwitchAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(tabSwitchAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start();

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [tabSwitchAnim]);

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
  }, [successModalScaleAnim, successModalOpacityAnim, successBackgroundOpacityAnim]);

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

  // Pay or receive a specific debt
  const handlePayOrReceive = (debt) => {
    openAccountModal(debt);
  };

  const handleAccountChoose = async (account) => {
    closeAccountModal();
    showLoadingWithAnimation();

    try {
      // Validate account balance for payments (when you owe)
      if (activeTab === "send") {
        const currentBalance = Number(account.currentBalance) || 0;
        if (currentBalance < selectedDebt.amount) {
          Alert.alert(
            "Insufficient Funds",
            `Your account "${account.title}" has a balance of $${currentBalance.toFixed(2)}, but you need $${selectedDebt.amount.toFixed(2)} to pay this debt.`,
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
        friend.id,
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
      if (activeTab === "send") {
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
        type: activeTab === "send" ? "Expenses" : "Income",
        category: activeTab === "send" ? "Debt Payment" : "Debt Collection",
        description: activeTab === "send"
          ? `Debt payment to ${friend.name}${selectedDebt.description ? ` - ${selectedDebt.description}` : ''}`
          : `Debt collection from ${friend.name}${selectedDebt.description ? ` - ${selectedDebt.description}` : ''}`,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        addedVia: 'debt-management',
        debtId: selectedDebt.id,
        friendId: friend.id,
        friendName: friend.name
      };

      // Add transaction to Firestore
      await addDoc(collection(firestore, "users", user.uid, "transactions"), transactionData);

      const message = activeTab === "send"
        ? `Debt of $${selectedDebt.amount.toFixed(2)} paid from "${account.title}"!`
        : `Payment of $${selectedDebt.amount.toFixed(2)} received to "${account.title}"!`;

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

  // Calculate separate amounts for received and sent
  const allUnpaidDebts = debts ? debts.filter((d) => !d.paid) : [];
  const youOweDebts = allUnpaidDebts.filter((d) => d.type === "Debt"); // You owe them (send)
  const theyOweDebts = allUnpaidDebts.filter((d) => d.type === "Credit"); // They owe you (receive)

  const youOweAmount = youOweDebts.reduce((sum, d) => sum + d.amount, 0);
  const theyOweAmount = theyOweDebts.reduce((sum, d) => sum + d.amount, 0);

  // Determine which debts to show based on active tab
  let relevantDebts = [];
  let isBalanced = false;

  if (activeTab === "send") {
    relevantDebts = youOweDebts;
  } else if (activeTab === "receive") {
    relevantDebts = theyOweDebts;
  }

  // Check if this specific tab's debts are balanced (empty)
  isBalanced = relevantDebts.length === 0;

  // Categorize and sort debts properly
  const categorizedDebts = categorizeAndSortDebts(relevantDebts);

  // Create a prioritized list: overdue first, then due today, then upcoming
  const prioritizedDebts = [
    ...categorizedDebts.overdue,
    ...categorizedDebts.dueToday,
    ...categorizedDebts.upcoming
  ];

  const currentDebt = prioritizedDebts[0];
  const upcomingDebts = prioritizedDebts.slice(1);

  const renderBadge = (badgeType) => {
    if (badgeType === "overdue") {
      return (
        <View style={styles.overdueBadge}>
          <Text style={styles.overdueText}>overdue</Text>
        </View>
      );
    }
    if (badgeType === "dueToday") {
      return (
        <View style={styles.dueTodayBadge}>
          <Text style={styles.dueTodayText}>due today</Text>
        </View>
      );
    }
    return null;
  };

  // Helper function to get status badge for a debt
  const getDebtStatusBadge = (debt) => {
    if (isDebtOverdue(debt.dueDate)) {
      return renderBadge("overdue");
    }
    const today = normalizeDate(new Date());
    const dueDate = normalizeDate(debt.dueDate);
    if (dueDate && dueDate.getTime() === today.getTime()) {
      return renderBadge("dueToday");
    }
    return null;
  };

  // Responsive card/image width
  const CARD_WIDTH = SCREEN_WIDTH - SIZES.padding.xxlarge * 2;

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Debt Details</Text>
        </View>
        <Text style={styles.infoText}>
          Here's your payment schedule with{" "}
          <Text style={styles.highlight}>{friend.name}</Text>. Debts are organized by priority to help you manage your payments effectively.
        </Text>

        <View style={styles.friendCardWrapper}>
          <FriendCard
            avatar={friend.avatar || require("../../../assets/Avatar01.png")}
            name={friend.name}
            email={friend.email}
            isFavorite={friend.isFavorite}
          />
        </View>

        {/* Tab buttons for Received and Send - Wrapped to stay static */}
        <View style={styles.tabContainerWrapper}>
          <View style={styles.tabContainer}>
            <Animated.View
              style={{
                flex: 1,
                transform: [{
                  scale: tabSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, activeTab === "receive" ? 0.95 : 1],
                  })
                }]
              }}
            >
              <View style={styles.tabButtonWrapper}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    styles.receiveButton,
                    activeTab === "receive" && styles.activeReceiveButton
                  ]}
                  onPress={() => animateTabSwitch("receive")}
                  disabled={paying}
                  activeOpacity={0.7}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name={activeTab === "receive" ? "arrow-down-circle" : "arrow-down-circle-outline"}
                      size={Math.round(SCREEN_WIDTH * 0.055)}
                      color={activeTab === "receive" ? "#FFFFFF" : "#1B5E20"}
                      style={styles.buttonIcon}
                    />
                    <Text style={[
                      styles.tabButtonText,
                      styles.receiveButtonText,
                      activeTab === "receive" && styles.activeReceiveButtonText
                    ]}>
                      Received
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Badge positioned in top right */}
                <View style={[styles.topRightBadge, styles.receiveBadge, activeTab === "receive" && styles.activeReceiveBadge]}>
                  <Text style={[styles.tabBadgeText, activeTab === "receive" && styles.activeBadgeText]}>
                    ${theyOweAmount.toFixed(0)}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                flex: 1,
                transform: [{
                  scale: tabSwitchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, activeTab === "send" ? 0.95 : 1],
                  })
                }]
              }}
            >
              <View style={styles.tabButtonWrapper}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    styles.sendButton,
                    activeTab === "send" && styles.activeSendButton
                  ]}
                  onPress={() => animateTabSwitch("send")}
                  disabled={paying}
                  activeOpacity={0.7}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name={activeTab === "send" ? "arrow-up-circle" : "arrow-up-circle-outline"}
                      size={Math.round(SCREEN_WIDTH * 0.055)}
                      color={activeTab === "send" ? "#FFFFFF" : "#B71C1C"}
                      style={styles.buttonIcon}
                    />
                    <Text style={[
                      styles.tabButtonText,
                      styles.sendButtonText,
                      activeTab === "send" && styles.activeSendButtonText
                    ]}>
                      Send
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Badge positioned in top right */}
                <View style={[styles.topRightBadge, styles.sendBadge, activeTab === "send" && styles.activeSendBadge]}>
                  <Text style={[styles.tabBadgeText, activeTab === "send" && styles.activeBadgeText]}>
                    ${youOweAmount.toFixed(0)}
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
          {/* Bottom border separator - Now INSIDE the wrapper, below the buttons */}

        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
        >
          {isBalanced ? (
            <>
              <Text style={styles.sectionHeader}>
                {activeTab === "send" ? "No Debts to Pay" : " No Payments to Receive"}
              </Text>
              <View style={[styles.debtCard, { width: CARD_WIDTH, backgroundColor: COLORS.lightGray }]}>
                <View style={styles.debtCardContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.debtLabel}>Status</Text>
                    <Text style={[styles.debtValue, { color: COLORS.primary }]}>
                      {activeTab === "send" ? "No Outstanding Debts" : "No Pending Payments"}
                    </Text>
                    <Text style={styles.debtLabel}>Amount</Text>
                    <Text style={[styles.amountReceived, { color: COLORS.primary }]}>
                      $0.00
                    </Text>
                    <Text style={styles.issueDate}>
                      {activeTab === "send"
                        ? `You don't owe ${friend.name} any money`
                        : `${friend.name} doesn't owe you any money`
                      }
                    </Text>
                  </View>
                  <Image
                    source={plantImage}
                    style={[
                      styles.plantImg,
                      {
                        width: "70%",
                        height: "70%",
                        left: "60%",
                        top: "40%",
                      },
                    ]}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <View style={[styles.settledBadge]}>
                    <Text style={styles.settledText}>Clear</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Update section headers based on active tab */}
              {categorizedDebts.overdue.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, styles.urgentHeader]}>
                    {activeTab === "send" ? "Overdue Payments" : "Overdue Collections"} ({categorizedDebts.overdue.length})
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {activeTab === "send"
                      ? "These payments are overdue and need immediate attention"
                      : "These collections are overdue - follow up required"
                    }
                  </Text>
                  {categorizedDebts.overdue.map((debt) => (
                    <TouchableOpacity
                      key={debt.id}
                      style={[styles.debtCard, { width: CARD_WIDTH, borderColor: "#E53935", borderWidth: 2, opacity: paying ? 0.5 : 1 }]}
                      onPress={paying ? undefined : () => handlePayOrReceive(debt)}
                      disabled={paying}
                      activeOpacity={0.7}
                    >
                      <View style={styles.debtCardContent}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.debtLabel}>Due Date</Text>
                          <Text style={[styles.debtValue, { color: "#E53935" }]}>
                            {formatDate(debt.dueDate)}
                          </Text>
                          <Text style={styles.debtLabel}>Amount</Text>
                          <Text style={activeTab === "send" ? styles.amountSent : styles.amountReceived}>
                            ${Number(debt.amount).toLocaleString()}
                          </Text>
                          <Text style={styles.issueDate}>
                            Date of issue: {formatDate(debt.date)}
                          </Text>
                          {debt.description && (
                            <Text style={styles.debtDescription}>
                              {debt.description}
                            </Text>
                          )}
                        </View>
                        <Image
                          source={plantImage}
                          style={[
                            styles.plantImg,
                            {
                              width: "70%",
                              height: "70%",
                              left: "60%",
                              top: "40%",
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.badgeRow}>
                        {getDebtStatusBadge(debt)}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Due Today */}
              {categorizedDebts.dueToday.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, styles.todayHeader]}>
                    {activeTab === "send" ? "Due Today - Pay Now" : "Due Today - Collect Now"} ({categorizedDebts.dueToday.length})
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {activeTab === "send"
                      ? "These payments are due today"
                      : "These collections are due today"
                    }
                  </Text>
                  {categorizedDebts.dueToday.map((debt) => (
                    <TouchableOpacity
                      key={debt.id}
                      style={[styles.debtCard, { width: CARD_WIDTH, borderColor: "#FDB347", borderWidth: 2, opacity: paying ? 0.5 : 1 }]}
                      onPress={paying ? undefined : () => handlePayOrReceive(debt)}
                      disabled={paying}
                      activeOpacity={0.7}
                    >
                      <View style={styles.debtCardContent}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.debtLabel}>Due Date</Text>
                          <Text style={[styles.debtValue, { color: "#FDB347" }]}>
                            {formatDate(debt.dueDate)}
                          </Text>
                          <Text style={styles.debtLabel}>Amount</Text>
                          <Text style={activeTab === "send" ? styles.amountSent : styles.amountReceived}>
                            ${Number(debt.amount).toLocaleString()}
                          </Text>
                          <Text style={styles.issueDate}>
                            Date of issue: {formatDate(debt.date)}
                          </Text>
                          {debt.description && (
                            <Text style={styles.debtDescription}>
                              {debt.description}
                            </Text>
                          )}
                        </View>
                        <Image
                          source={plantImage}
                          style={[
                            styles.plantImg,
                            {
                              width: "70%",
                              height: "70%",
                              left: "60%",
                              top: "40%",
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.badgeRow}>
                        {getDebtStatusBadge(debt)}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Upcoming */}
              {categorizedDebts.upcoming.length > 0 && (
                <>
                  <Text style={[styles.sectionHeader, styles.upcomingHeader]}>
                    {activeTab === "send" ? "Future Payments" : "Future Collections"} ({categorizedDebts.upcoming.length})
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {activeTab === "send"
                      ? "Upcoming payments you can plan for"
                      : "Upcoming collections you can expect"
                    }
                  </Text>
                  {categorizedDebts.upcoming.map((debt) => (
                    <TouchableOpacity
                      key={debt.id}
                      style={[styles.debtCard, { width: CARD_WIDTH, opacity: paying ? 0.5 : 1 }]}
                      onPress={paying ? undefined : () => handlePayOrReceive(debt)}
                      disabled={paying}
                      activeOpacity={0.7}
                    >
                      <View style={styles.debtCardContent}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.debtLabel}>Due Date</Text>
                          <Text style={styles.debtValue}>{formatDate(debt.dueDate)}</Text>
                          <Text style={styles.debtLabel}>Amount</Text>
                          <Text style={activeTab === "send" ? styles.amountSent : styles.amountReceived}>
                            ${Number(debt.amount).toLocaleString()}
                          </Text>
                          <Text style={styles.issueDate}>
                            Date of issue: {formatDate(debt.date)}
                          </Text>
                          {debt.description && (
                            <Text style={styles.debtDescription}>
                              {debt.description}
                            </Text>
                          )}
                        </View>
                        <Image
                          source={plantImage}
                          style={[
                            styles.plantImg,
                            {
                              width: "70%",
                              height: "70%",
                              left: "60%",
                              top: "40%",
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.badgeRow}>
                        {getDebtStatusBadge(debt)}
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* No debts message */}
              {prioritizedDebts.length === 0 && (
                <>
                  <Text style={styles.sectionHeader}>
                    {activeTab === "send" ? "No Payments Required" : "No Collections Pending"}
                  </Text>
                  <Text style={styles.noDebtText}>
                    {activeTab === "send"
                      ? `No outstanding debts to pay to ${friend.name}`
                      : `No pending payments to collect from ${friend.name}`
                    }
                  </Text>
                </>
              )}
            </>
          )}
        </ScrollView>

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
                      {activeTab === "send" ? "to pay from" : "to receive to"}:
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
                        borderLeftColor: activeTab === "send" ? "#FF6B6B" : "#4ECDC4",
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
                        {activeTab === "send" ? "Paying" : "Receiving"}: <Text style={{ fontWeight: "bold", color: "#111" }}>${selectedDebt.amount.toFixed(2)}</Text>
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
                      const hasInsufficientFunds = activeTab === "send" && selectedDebt && currentBalance < selectedDebt.amount;

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
                            ${currentBalance.toFixed(2)}
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
                  {activeTab === "send"
                    ? "Paying your debt, please wait..."
                    : "Processing payment receipt, please wait..."
                  }
                </Text>
                <Text style={{
                  fontSize: Math.round(SCREEN_WIDTH * 0.04),
                  textAlign: "center",
                  lineHeight: 20,
                  color: COLORS.textSecondary,
                  fontFamily: "Poppins-Regular",
                }}>
                  {activeTab === "send"
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
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingBottom: SIZES.padding.medium,
    marginBottom: SIZES.padding.large,
  },
  title: {
    fontSize: SIZES.font.xlarge,
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
    color: COLORS.text,
    fontFamily: FONTS.h3.fontFamily,
    fontWeight: "600",
  },
  infoText: {
    textAlign: "left",
    fontSize: SIZES.font.medium,
    color: COLORS.textSecondary,
    marginHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.xlarge,
    fontFamily: FONTS.body2.fontFamily,
    lineHeight: 24,
  },
  highlight: {
    color: COLORS.primary,
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.medium,
    fontWeight: "600",
  },
  friendCardWrapper: {
    marginHorizontal: SIZES.padding.xxlarge,
    paddingBottom: SIZES.padding.large,
  },
  sectionHeader: {
    color: COLORS.darkGray,
    marginTop: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.medium,
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.large,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  debtCard: {
    backgroundColor: COLORS.header,
    borderRadius: SIZES.radius.large,
    padding: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.large,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: "hidden",
    minHeight: 160,
    justifyContent: "flex-end",
    alignSelf: "center",
  },
  debtCardContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 120,
    position: "relative",
  },
  debtLabel: {
    color: COLORS.inactive,
    fontFamily: FONTS.body3.fontFamily,
    fontSize: SIZES.font.medium,
    marginTop: 6,
    fontWeight: "500",
  },
  debtValue: {
    color: COLORS.text,
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.large,
    marginBottom: 4,
    fontWeight: "600",
  },
  amountReceived: {
    marginTop: 4,
    color: "#1BC47D", // bright green
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.xxlarge,
    fontWeight: "700",
    flexShrink: 1,
  },
  amountSent: {
    marginTop: 4,
    color: "#E53935", // strong red
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.xxlarge,
    fontWeight: "700",
    flexShrink: 1,
  },
  issueDate: {
    color: COLORS.inactive,
    marginTop: 6,
    fontFamily: FONTS.body3.fontFamily,
    fontSize: SIZES.font.medium,
    opacity: 0.8,
  },
  debtDescription: {
    color: COLORS.textSecondary,
    marginTop: 6,
    fontFamily: FONTS.body3.fontFamily,
    fontSize: SIZES.font.medium,
    fontStyle: "italic",
    opacity: 0.9,
  },
  plantImg: {
    position: "absolute",
    resizeMode: "contain",
    opacity: 0.9,
    zIndex: 0,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SIZES.padding.medium,
    paddingTop: SIZES.padding.small,
  },
  overdueBadge: {
    backgroundColor: COLORS.LightRed,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  overdueText: {
    color: "#E53935",
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.small,
    textTransform: "lowercase",
    fontWeight: "bold",
  },
  dueTodayBadge: {
    backgroundColor: "#FDB347",
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  dueTodayText: {
    color: COLORS.white,
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.small,
    textTransform: "lowercase",
    fontWeight: "bold",
  },
  settledBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginLeft: 4,
  },
  settledText: {
    color: COLORS.white,
    fontFamily: FONTS.h3.fontFamily,
    fontSize: SIZES.font.small,
    textTransform: "capitalize",
    fontWeight: "bold",
  },
  noDebtText: {
    color: COLORS.inactive,
    marginLeft: 8,
    marginBottom: SIZES.padding.large,
    fontFamily: FONTS.body3.fontFamily,
    fontSize: SIZES.font.medium,
    opacity: 0.8,
  },
  urgentHeader: {
    color: "#E53935",
  },
  todayHeader: {
    color: "#FDB347",
  },
  upcomingHeader: {
    color: "#4CAF50",
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding.large,
    fontFamily: FONTS.body3.fontFamily,
    fontSize: SIZES.font.medium,
    opacity: 0.9,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  scrollContainer: {
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: SIZES.padding.medium,
  },
  tabContainerWrapper: {
    backgroundColor: COLORS.white,
    zIndex: 10,
    paddingBottom: Math.round(SCREEN_HEIGHT * 0.07),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: Math.round(SCREEN_WIDTH * 0.05),
    paddingTop: Math.round(SCREEN_HEIGHT * 0.02),
    paddingBottom: Math.round(SCREEN_HEIGHT * 0.015),
    gap: Math.round(SCREEN_WIDTH * 0.025),
  },
  tabButtonWrapper: {
    flex: 1,
    position: "relative",
    overflow: "visible",
  },
  tabButton: {
    flex: 1,
    paddingVertical: Math.round(SCREEN_HEIGHT * 0.018),
    paddingHorizontal: Math.round(SCREEN_WIDTH * 0.02),
    borderRadius: Math.round(SCREEN_WIDTH * 0.04),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Math.round(SCREEN_HEIGHT * 0.07),
    maxHeight: Math.round(SCREEN_HEIGHT * 0.09),
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },
  receiveButton: {
    backgroundColor: "#F0F9F0",
    borderWidth: Math.max(1, Math.round(SCREEN_WIDTH * 0.005)),
    borderColor: "#4CAF50",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendButton: {
    backgroundColor: "#FFF5F5",
    borderWidth: Math.max(1, Math.round(SCREEN_WIDTH * 0.005)),
    borderColor: "#F44336",
    shadowColor: "#F44336",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabButtonText: {
    fontSize: Math.round(SCREEN_WIDTH * 0.04),
    fontFamily: FONTS.h3.fontFamily,
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.3,
    flexShrink: 1,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  receiveButtonText: {
    color: "#1B5E20",
    fontWeight: "700",
  },
  sendButtonText: {
    color: "#B71C1C",
    fontWeight: "700",
  },
  activeReceiveButton: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  activeSendButton: {
    backgroundColor: "#F44336",
    borderColor: "#D32F2F",
    shadowColor: "#F44336",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  activeReceiveButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  activeSendButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  topRightBadge: {
    position: "absolute",
    top: -Math.round(SCREEN_HEIGHT * 0.012),
    right: -Math.round(SCREEN_WIDTH * 0.02),
    borderRadius: Math.round(SCREEN_WIDTH * 0.035),
    paddingHorizontal: Math.round(SCREEN_WIDTH * 0.03),
    paddingVertical: Math.round(SCREEN_HEIGHT * 0.008),
    minWidth: Math.round(SCREEN_WIDTH * 0.12),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
    transform: [{ scale: 0.95 }],
  },
  receiveBadge: {
    backgroundColor: "#2E7D32",
  },
  sendBadge: {
    backgroundColor: "#C62828",
  },
  activeReceiveBadge: {
    backgroundColor: "#1B5E20",
    shadowColor: "#4CAF50",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    borderColor: "rgba(255,255,255,1)",
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  activeSendBadge: {
    backgroundColor: "#B71C1C",
    shadowColor: "#F44336",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    borderColor: "rgba(255,255,255,1)",
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  activeBadgeText: {
    color: COLORS.white,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabBadgeText: {
    fontSize: Math.round(SCREEN_WIDTH * 0.035),
    fontFamily: FONTS.h3.fontFamily,
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: 0,
    flexShrink: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingRight: Math.round(SCREEN_WIDTH * 0.08),
  },
  buttonIcon: {
    marginRight: Math.round(SCREEN_WIDTH * 0.025),
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
});

export default DebtDetails;
