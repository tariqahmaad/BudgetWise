import React, { useState, useEffect } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cleanupEmptyCategories } from "../../../services/transactionService";

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
  const [transactionType, setTransactionType] = useState("Expenses");
  const [showNotification, setShowNotification] = useState(false);
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
        alert("Please select an account");
        setIsSaving(false);
        return;
      }

      // Create enhanced transaction data object combining both versions
      const transactionData = {
        amount: amountValue,
        description: description,
        type: transactionType,
        accountId: selectedAccountId,
        date: date.toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(), // Added from second version
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

      // Save the transaction to Firestore
      await addDoc(
        collection(firestore, "users", user.uid, "transactions"),
        transactionData
      );

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
      alert("Failed to save transaction. Please try again.");
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
              disabled={isSaving}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  notificationBox: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding.xxxlarge,
    borderRadius: SIZES.radius.medium,
    width: "80%",
    alignItems: "center",
    ...SHADOWS.medium,
    elevation: 5,
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
});

export default AddTransactions;
