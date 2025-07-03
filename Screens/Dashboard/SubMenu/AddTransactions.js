import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Modal,
  TouchableOpacity,
  Platform,
  FlatList,
  Alert,
  Animated,
  Easing,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cleanupEmptyCategories } from "../../../services/transactionService";
import { useCurrency } from "../../../contexts/CurrencyContext";

import ToggleSwitch from "../../../Components/Buttons/ToggleSwitch";
import BackButton from "../../../Components/Buttons/BackButton";
import CustomButton from "../../../Components/Buttons/CustomButton";
import InputField from "../../../Components/InputField/InputField";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import {
  COLORS,
  SIZES,
  SHADOWS,
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_COLORS,
} from "../../../constants/theme";

import {
  firestore,
  collection,
  addDoc,
  serverTimestamp,
  auth,
  query,
  where,
  getDocs,
  updateDoc,
  doc as firestoreDoc,
} from "../../../firebase/firebaseConfig";

const AddTransactions = ({ navigation }) => {
  // Currency context hook
  const { getCurrencySymbol } = useCurrency();

  const [transactionType, setTransactionType] = useState("Expenses");
  const [showNotification, setShowNotification] = useState(false);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);

  // Animation refs for no account modal
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current;

  // Handle no account modal open with smooth animation
  const openNoAccountModal = () => {
    setShowNoAccountModal(true);

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
  };

  // Handle no account modal close with animation
  const handleNoAccountModalClose = () => {
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
      setShowNoAccountModal(false);
      // Reset animation values
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
      backgroundOpacityAnim.setValue(0);
    });
  };

  // Handle navigation to ManageAccounts with animation
  const handleNavigateToAccounts = () => {
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
      setShowNoAccountModal(false);
      // Reset animation values
      modalScaleAnim.setValue(0);
      modalOpacityAnim.setValue(0);
      backgroundOpacityAnim.setValue(0);
      navigation.navigate("ManageAccounts");
    });
  };
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState(
    CATEGORY_ICONS[0].label
  );
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // State for accounts
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  // Loading state to prevent duplicate submissions
  const [isSaving, setIsSaving] = useState(false);

  // State to track if large amount has been confirmed
  const [largeAmountConfirmed, setLargeAmountConfirmed] = useState(false);

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const accountsRef = collection(
          firestore,
          "users",
          user.uid,
          "accounts"
        );
        const querySnapshot = await getDocs(accountsRef);
        const accountsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          icon:
            doc.data().type === "balance"
              ? "wallet-sharp"
              : doc.data().type === "income_tracker"
                ? "stats-chart"
                : "trophy",
        }));

        setAccounts(accountsData);
        if (accountsData.length > 0) {
          setSelectedAccountId(accountsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, []);

  const handleCategorySelection = (label, index) => {
    setSelectedCategoryLabel(label);
    setSelectedCategoryIndex(index);
  };

  const handleAccountSelection = (id, index) => {
    setSelectedAccountId(id);
    setSelectedAccountIndex(index);
  };

  const handleToggle = (type) => {
    setTransactionType(type);
  };

  // Handle amount change and reset large amount confirmation
  const handleAmountChange = (value) => {
    setAmount(value);
    // Reset confirmation when amount changes
    setLargeAmountConfirmed(false);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onDateChange = (_, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "Select Date";
    return dateObj.toLocaleDateString();
  };

  // Enhanced helper function to check if a category exists with case-insensitive matching
  const checkCategoryExists = async (categoryName) => {
    const user = auth.currentUser;
    if (!user || !categoryName) return false;

    try {
      const normalizedCategoryName = categoryName.trim();
      const lowerCaseCategoryName = normalizedCategoryName.toLowerCase();

      const categoriesRef = collection(
        firestore,
        "users",
        user.uid,
        "categories"
      );

      const allCategoriesSnapshot = await getDocs(categoriesRef);

      for (const categoryDoc of allCategoriesSnapshot.docs) {
        const data = categoryDoc.data();

        const fieldsToCheck = [
          data.name,
          data.label,
          data.Category,
          data.categoryName,
        ];

        for (const fieldValue of fieldsToCheck) {
          if (fieldValue && typeof fieldValue === "string") {
            const normalizedFieldValue = fieldValue.trim().toLowerCase();
            if (normalizedFieldValue === lowerCaseCategoryName) {
              console.log(
                `[AddTx Category Check] Found existing category: "${fieldValue}" matches "${categoryName}"`
              );
              return true;
            }
          }
        }
      }

      console.log(
        `[AddTx Category Check] No existing category found for: "${categoryName}"`
      );
      return false;
    } catch (error) {
      console.error("Error checking category existence:", error);
      return true;
    }
  };

  // Enhanced function to create a new category if it doesn't exist, but only for predefined categories
  const createCategoryIfNeeded = async (categoryLabel) => {
    const user = auth.currentUser;
    if (!user || !categoryLabel) return;

    try {
      const normalizedCategoryLabel = categoryLabel.trim();

      if (!normalizedCategoryLabel) {
        console.warn(
          "[AddTx] Category name is empty after trimming, skipping creation"
        );
        return null;
      }

      const predefinedCategory = CATEGORY_ICONS.find(
        (cat) =>
          cat.label.toLowerCase() === normalizedCategoryLabel.toLowerCase()
      );

      if (!predefinedCategory) {
        console.warn(
          `[AddTx] Category "${normalizedCategoryLabel}" is not in predefined list, skipping creation`
        );
        return null;
      }

      const categoryExists = await checkCategoryExists(normalizedCategoryLabel);
      if (categoryExists) {
        console.log(
          "[AddTx] Category already exists:",
          normalizedCategoryLabel
        );
        return;
      }

      const iconName = predefinedCategory.name;
      const backgroundColor = DEFAULT_CATEGORY_COLORS[0].value;
      const properCaseName = predefinedCategory.label;

      const categoryData = {
        userId: user.uid,
        name: properCaseName,
        iconName: iconName,
        backgroundColor: backgroundColor,
        createdAt: serverTimestamp(),
        label: properCaseName,
        Category: properCaseName,
        lastUpdated: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(firestore, "users", user.uid, "categories"),
        categoryData
      );
      console.log(
        "[AddTx] Created new predefined category:",
        properCaseName,
        "with ID:",
        docRef.id
      );

      return docRef.id;
    } catch (error) {
      console.error("Error creating category:", error);
      return null;
    }
  };

  // Function to check and confirm large amounts (7+ digits)
  const checkLargeAmountConfirmation = (amountValue) => {
    return new Promise((resolve) => {
      // Check if amount has 7 or more digits
      const amountString = Math.abs(amountValue).toString().replace(/\./g, '');
      if (amountString.length >= 7) {
        Alert.alert(
          "Large Amount Detected",
          `You're about to add a transaction of ${amountValue.toLocaleString()}. This is a large amount. Are you sure you want to proceed?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Confirm",
              style: "default",
              onPress: () => {
                setLargeAmountConfirmed(true);
                resolve(true);
              },
            },
          ]
        );
      } else {
        resolve(true);
      }
    });
  };

  const handleSaveTransaction = async () => {
    if (isSaving) {
      console.log(
        "Transaction save already in progress, ignoring duplicate request"
      );
      return;
    }

    try {
      setIsSaving(true);

      const user = auth.currentUser;
      if (!user) {
        console.log("No user logged in");
        setIsSaving(false);
        return;
      }

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        alert("Please enter a valid amount");
        setIsSaving(false);
        return;
      }

      // Check for large amount confirmation
      const amountString = Math.abs(amountValue).toString().replace(/\./g, '');
      if (amountString.length >= 7 && !largeAmountConfirmed) {
        const confirmed = await checkLargeAmountConfirmation(amountValue);
        if (!confirmed) {
          setIsSaving(false);
          return;
        }
      }

      if (!selectedAccountId) {
        if (accounts.length === 0) {
          openNoAccountModal();
          setIsSaving(false);
        } else {
          alert("Please select an account");
          setIsSaving(false);
        }
        return;
      }

      // Add a unique timestamp to prevent duplicate submissions
      const now = new Date();
      const uniqueTimestamp = now.getTime();

      // Create enhanced transaction data object combining both versions
      const transactionData = {
        amount: amountValue,
        description: description,
        type: transactionType,
        accountId: selectedAccountId,
        date: date.toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        clientTimestamp: uniqueTimestamp, // Add unique client timestamp
      };

      // Add account name for better reference
      const selectedAccount = accounts.find(
        (acc) => acc.id === selectedAccountId
      );
      transactionData.accountName = selectedAccount?.title || "Unknown Account";

      // Add category for expense transactions
      if (transactionType === "Expenses") {
        transactionData.category = selectedCategoryLabel;

        // Create category if needed (only metadata, no amount calculation)
        const categoryId = await createCategoryIfNeeded(selectedCategoryLabel);

        // Update category last updated timestamp if it exists
        if (categoryId) {
          const categoryRef = firestoreDoc(
            firestore,
            "users",
            user.uid,
            "categories",
            categoryId
          );
          await updateDoc(categoryRef, {
            lastUpdated: serverTimestamp(),
          });
        } else {
          // If we don't have a category ID but the category should exist, find it and update timestamp
          const categoriesRef = collection(
            firestore,
            "users",
            user.uid,
            "categories"
          );
          const q = query(
            categoriesRef,
            where("name", "==", selectedCategoryLabel)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const categoryDoc = querySnapshot.docs[0];
            await updateDoc(
              firestoreDoc(
                firestore,
                "users",
                user.uid,
                "categories",
                categoryDoc.id
              ),
              {
                lastUpdated: serverTimestamp(),
              }
            );
          }
        }
      }

      // Save the transaction to Firestore with retry logic
      let transactionDoc = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          transactionDoc = await addDoc(
            collection(firestore, "users", user.uid, "transactions"),
            transactionData
          );
          break; // Success, exit retry loop
        } catch (saveError) {
          retryCount++;
          console.log(`Transaction save attempt ${retryCount} failed:`, saveError.message);

          if (saveError.code === 'already-exists' || saveError.message.includes('Document already exists')) {
            // Document already exists, this might be a duplicate submission
            console.warn("Transaction might already exist, checking for duplicates...");

            // Check for recent transactions with same details to avoid true duplicates
            const recentTransactionsQuery = query(
              collection(firestore, "users", user.uid, "transactions"),
              where("amount", "==", amountValue),
              where("description", "==", description),
              where("type", "==", transactionType),
              where("accountId", "==", selectedAccountId)
            );

            const recentTransactions = await getDocs(recentTransactionsQuery);
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

            const isDuplicate = recentTransactions.docs.some(doc => {
              const data = doc.data();
              const docTimestamp = data.clientTimestamp || (data.createdAt?.seconds * 1000) || 0;
              return docTimestamp > fiveMinutesAgo;
            });

            if (isDuplicate) {
              console.log("Duplicate transaction detected, skipping save");
              alert("This transaction appears to have been saved already.");
              setIsSaving(false);
              return;
            }
          }

          if (retryCount >= maxRetries) {
            throw saveError; // Re-throw after max retries
          }

          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      if (!transactionDoc) {
        throw new Error("Failed to save transaction after multiple attempts");
      }

      // Invalidate insights cache after successful add
      try {
        await AsyncStorage.removeItem("@budgetwise_insights");
        console.log("[AddTransaction] Cleared insights cache after add.");
      } catch (e) {
        console.warn("[AddTransaction] Failed to clear insights cache:", e);
      }

      // Update only the selected account
      const accountRef = firestoreDoc(
        firestore,
        "users",
        user.uid,
        "accounts",
        selectedAccountId
      );
      const accountSnapshot = await getDocs(
        query(
          collection(firestore, "users", user.uid, "accounts"),
          where("__name__", "==", selectedAccountId)
        )
      );

      if (!accountSnapshot.empty) {
        const accountDoc = accountSnapshot.docs[0];
        const accountData = accountDoc.data();
        const currentBalance = accountData.currentBalance || 0;

        if (transactionType === "Income") {
          const totalIncome = accountData.totalIncome || 0;
          await updateDoc(accountRef, {
            currentBalance: currentBalance + amountValue,
            totalIncome: totalIncome + amountValue,
          });
        } else {
          const totalExpenses = accountData.totalExpenses || 0;
          await updateDoc(accountRef, {
            currentBalance: currentBalance - amountValue,
            totalExpenses: totalExpenses + amountValue,
          });
        }
      }

      // Reset form and show success notification
      setAmount("");
      setDate(new Date());
      setDescription("");
      setSelectedCategoryLabel(CATEGORY_ICONS[0].label);
      setSelectedCategoryIndex(0);
      setSelectedAccountIndex(0);
      setLargeAmountConfirmed(false);
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }

      setShowNotification(true);
      setIsSaving(false);
      setTimeout(() => {
        setShowNotification(false);
        navigation.goBack();
      }, 1000);
    } catch (error) {
      console.error("Error saving transaction:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to save transaction. Please try again.";
      if (error.code === 'already-exists' || error.message.includes('Document already exists')) {
        errorMessage = "This transaction may have already been saved. Please check your transaction history.";
      } else if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Please check your account permissions.";
      } else if (error.code === 'network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      alert(errorMessage);
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header with improved centering */}
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.title}>Add Transactions</Text>
        </View>

        <Text style={styles.subText}>
          You may add your transactions here. Make sure to fill all fields as
          they improve your overall experience in our application
        </Text>

        <View style={styles.toggleWrapper}>
          <ToggleSwitch onToggle={handleToggle} disabled={isSaving} />
        </View>

        <ScrollView style={styles.formContainer} scrollEnabled={!isSaving}>
          <InputField
            title="Amount"
            value={amount}
            onChangeText={handleAmountChange}
            editable={!isSaving}
            enableValidation={true}
          />

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.dateInputRow}>
              <TouchableOpacity
                onPress={isSaving ? undefined : () => setShowDatePicker(true)}
                style={styles.datePickerTouchable}
                disabled={isSaving}
              >
                <Text style={styles.datePickerText}>{formatDate(date)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lineContainer}>
              <View style={styles.line} />
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              onChange={onDateChange}
              accentColor={COLORS.primary}
              backgroundColor={COLORS.lightGray}
              display="default"
            />
          )}

          <InputField
            title="Description"
            value={description}
            onChangeText={setDescription}
            editable={!isSaving}
            enableValidation={true}
          />

          {/* Account selection */}
          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Account</Text>
            {accounts.length === 0 ? (
              <Text style={styles.noAccountsText}>
                No accounts available. Please add accounts in Settings.
              </Text>
            ) : (
              <View style={styles.iconsSliderContainer}>
                <FlatList
                  data={accounts}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.iconSliderItem,
                        selectedAccountIndex === index &&
                        styles.selectedIconItem,
                      ]}
                      onPress={
                        isSaving
                          ? undefined
                          : () => handleAccountSelection(item.id, index)
                      }
                      disabled={isSaving}
                    >
                      <View
                        style={[
                          styles.iconBubble,
                          { backgroundColor: "#333" },
                          selectedAccountIndex === index &&
                          styles.selectedIconBubble,
                        ]}
                      >
                        <Ionicons name={item.icon} size={24} color="#FFF" />
                      </View>
                      <Text style={styles.iconLabel} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconsSlider}
                />
              </View>
            )}
          </View>

          {/* Category selection only for expenses */}
          {transactionType === "Expenses" && (
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.iconsSliderContainer}>
                <FlatList
                  data={CATEGORY_ICONS}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      style={[
                        styles.iconSliderItem,
                        selectedCategoryIndex === index &&
                        styles.selectedIconItem,
                      ]}
                      onPress={
                        isSaving
                          ? undefined
                          : () => handleCategorySelection(item.label, index)
                      }
                      disabled={isSaving}
                    >
                      <View
                        style={[
                          styles.iconBubble,
                          selectedCategoryIndex === index &&
                          styles.selectedIconBubble,
                        ]}
                      >
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
          )}

          <View style={styles.buttonWrapper}>
            <CustomButton
              title="Save Transaction"
              onPress={handleSaveTransaction}
              loading={isSaving}
              disabled={isSaving || !amount.trim()}
            />
          </View>
        </ScrollView>

        <Modal
          transparent={true}
          visible={showNotification}
          animationType="fade"
          onRequestClose={() => setShowNotification(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.notificationBox}>
              <Text style={styles.notificationTitle}>Success!</Text>
              <Text style={styles.notificationText}>
                Your transaction has been added to your budget.
              </Text>
            </View>
          </View>
        </Modal>

        {/* No Account Modal */}
        <Modal
          transparent={true}
          visible={showNoAccountModal}
          animationType="none"
          onRequestClose={handleNoAccountModalClose}
          statusBarTranslucent={true}
        >
          <Animated.View
            style={[
              styles.noAccountModalOverlay,
              {
                backgroundColor: backgroundOpacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)'],
                }),
              }
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={handleNoAccountModalClose}
            />
            <Animated.View
              style={[
                styles.noAccountModalBox,
                {
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
                }
              ]}
              onStartShouldSetResponder={() => true}
            >
              <Animated.View
                style={[
                  styles.noAccountModalHeader,
                  {
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
                  }
                ]}
              >
                <View style={styles.noAccountIcon}>
                  <Ionicons name="wallet-outline" size={60} color={COLORS.primary} />
                </View>

                <Text style={styles.noAccountTitle}>No Accounts Found</Text>
                <Text style={styles.noAccountMessage}>
                  You need to create at least one account before adding transactions.
                  Accounts help you organize and track your finances better.
                </Text>
              </Animated.View>

              <ScrollView
                style={styles.noAccountScrollView}
                showsVerticalScrollIndicator={false}
              >
                <Animated.View
                  style={[
                    styles.noAccountFeatures,
                    {
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
                    }
                  ]}
                >
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success || "#4CAF50"} />
                    <Text style={styles.featureText}>Track your spending</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success || "#4CAF50"} />
                    <Text style={styles.featureText}>Organize by account type</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success || "#4CAF50"} />
                    <Text style={styles.featureText}>Monitor your progress</Text>
                  </View>
                </Animated.View>
              </ScrollView>

              <Animated.View
                style={[
                  styles.noAccountButtonContainer,
                  {
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
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.noAccountButton, styles.cancelButton]}
                  onPress={handleNoAccountModalClose}
                >
                  <Text style={styles.cancelButtonText}>Maybe Later</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.noAccountButton, styles.createAccountButton]}
                  onPress={handleNavigateToAccounts}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.white} style={styles.buttonIcon} />
                  <Text style={styles.createAccountButtonText}>Create Account</Text>
                </TouchableOpacity>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  title: {
    fontSize: SIZES.font.xlarge,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
    flex: 1,
    marginRight: SIZES.padding.xxlarge,
  },
  subText: {
    fontSize: SIZES.font.medium,
    textAlign: "left",
    marginHorizontal: SIZES.padding.xxxlarge,
    marginBottom: SIZES.padding.large,
    color: COLORS.textSecondary,
  },
  toggleWrapper: {
    paddingHorizontal: SIZES.padding.large,
    marginBottom: SIZES.padding.medium,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginTop: SIZES.padding.large,
  },
  fieldWrapper: {
    marginBottom: SIZES.padding.small,
  },
  fieldLabel: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding.medium,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  datePickerTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.xlarge,
    paddingHorizontal: SIZES.padding.large,
  },
  datePickerText: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
  },
  lineContainer: {
    flexDirection: "row",
  },
  line: {
    height: 1,
    backgroundColor: COLORS.authDivider,
    flex: 1,
  },
  buttonWrapper: {
    alignItems: "center",
    marginVertical: SIZES.padding.xxxlarge,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  notificationBox: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding.xxxlarge,
    borderRadius: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 15,
  },
  notificationTitle: {
    fontSize: SIZES.font.xlarge,
    fontWeight: "bold",
    marginBottom: SIZES.padding.large,
    color: COLORS.primary,
  },
  notificationText: {
    fontSize: SIZES.font.medium,
    textAlign: "center",
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  iconsSliderContainer: {
    backgroundColor: COLORS.lightGrayBackground,
    borderRadius: SIZES.radius.medium,
    marginBottom: SIZES.padding.medium,
  },
  iconsSlider: {
    paddingVertical: 4,
  },
  iconSliderItem: {
    width: 80,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectedIconItem: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: SIZES.radius.medium,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedIconBubble: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  iconLabel: {
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Medium",
    color: COLORS.darkGray,
    textAlign: "center",
    maxWidth: "100%",
  },
  noAccountsText: {
    fontSize: SIZES.font.medium,
    color: COLORS.textSecondary,
    textAlign: "center",
    padding: SIZES.padding.large,
  },
  // No Account Modal Styles
  noAccountModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 0,
  },
  noAccountModalBox: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
    overflow: "hidden",
  },
  noAccountModalHeader: {
    width: "100%",
    paddingTop: SIZES.padding.xxxlarge,
    paddingHorizontal: SIZES.padding.xxxlarge,
    paddingBottom: SIZES.padding.medium,
    alignItems: "center",
  },
  noAccountScrollView: {
    width: "100%",
    paddingHorizontal: SIZES.padding.xxxlarge,
    marginBottom: SIZES.padding.medium,
    maxHeight: 200,
  },
  noAccountIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.lightGrayBackground || "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SIZES.padding.xlarge,
  },
  noAccountTitle: {
    fontSize: SIZES.font.xxlarge,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginBottom: SIZES.padding.medium,
    textAlign: "center",
  },
  noAccountMessage: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SIZES.padding.xlarge,
  },
  noAccountFeatures: {
    width: "100%",
    marginBottom: SIZES.padding.xlarge,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.medium,
  },
  featureText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
    marginLeft: SIZES.padding.medium,
    flex: 1,
  },
  noAccountButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.xxxlarge,
    paddingBottom: SIZES.padding.xxxlarge,
    width: "100%",
    backgroundColor: COLORS.white,
    gap: SIZES.padding.medium,
  },
  noAccountButton: {
    flex: 1,
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.medium,
    borderRadius: SIZES.radius.medium,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
  },
  cancelButton: {
    backgroundColor: COLORS.lightGrayBackground || "#F5F7FA",
    borderWidth: 1,
    borderColor: COLORS.lightGray || "#E0E0E0",
  },
  createAccountButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButtonText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Medium",
    color: COLORS.textSecondary,
  },
  createAccountButtonText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.white,
  },
  buttonIcon: {
    marginRight: SIZES.padding.small,
  },
});

export default AddTransactions;
