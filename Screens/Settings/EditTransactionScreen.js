import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  auth,
  firestore,
  doc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "../../firebase/firebaseConfig";
import { COLORS, SIZES, SHADOWS, CATEGORY_ICONS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import InputField from "../../Components/InputField/InputField";
import CustomButton from "../../Components/Buttons/CustomButton";
import ToggleSwitch from "../../Components/Buttons/ToggleSwitch";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cleanupEmptyCategories } from "../../services/transactionService";

const EditTransactionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = auth.currentUser;

  const { transaction, accountId: initialAccountId } = route.params || {};

  const [accounts, setAccounts] = useState([]);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    type: "Expenses",
    accountId: "",
    date: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Initialize form with transaction data
  useEffect(() => {
    if (transaction) {
      console.log("Transaction type:", transaction.type);
      const transactionType = transaction.type || "Expenses";

      setFormData({
        amount: Math.abs(transaction.amount || 0).toString(),
        description: transaction.description || "",
        category: transaction.category || "",
        type: transactionType,
        accountId: transaction.accountId || initialAccountId || "",
        date: transaction.date
          ? transaction.date.toDate
            ? transaction.date.toDate()
            : new Date(transaction.date)
          : new Date(),
      });

      setIsFormInitialized(true);
      console.log("Form initialized with type:", transactionType);
    }
  }, [transaction, initialAccountId]);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      try {
        const accountsRef = collection(
          firestore,
          "users",
          user.uid,
          "accounts"
        );
        const snapshot = await getDocs(accountsRef);
        const accountsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          icon:
            doc.data().type === "balance"
              ? "wallet-sharp"
              : doc.data().type === "income_tracker"
                ? "stats-chart"
                : "trophy",
        }));
        setAccounts(accountsList);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchAccounts();
  }, [user]);

  // Set initial selected indices when accounts load and form data is available
  useEffect(() => {
    if (accounts.length > 0 && formData.accountId) {
      const accountIndex = accounts.findIndex(
        (acc) => acc.id === formData.accountId
      );
      if (accountIndex !== -1) {
        setSelectedAccountIndex(accountIndex);
      }
    }

    if (formData.category) {
      const categoryIndex = CATEGORY_ICONS.findIndex(
        (cat) => cat.label === formData.category
      );
      if (categoryIndex !== -1) {
        setSelectedCategoryIndex(categoryIndex);
      }
    }
  }, [accounts, formData.accountId, formData.category]);

  // Memoize the key to prevent unnecessary re-renders
  const toggleKey = useMemo(
    () => `toggle-${transaction?.id || "new"}-${formData.type}`,
    [transaction?.id, formData.type]
  );

  // Memoize handlers to prevent re-creation on every render
  const handleCategorySelection = useCallback((label, index) => {
    setFormData((prev) => ({ ...prev, category: label }));
    setSelectedCategoryIndex(index);
  }, []);

  const handleAccountSelection = useCallback((id, index) => {
    setFormData((prev) => ({ ...prev, accountId: id }));
    setSelectedAccountIndex(index);
  }, []);

  const handleToggle = useCallback((type) => {
    setFormData((prev) => ({ ...prev, type }));
  }, []);

  const handleAmountChange = useCallback((text) => {
    setFormData((prev) => ({ ...prev, amount: text }));
  }, []);

  const handleDescriptionChange = useCallback((text) => {
    setFormData((prev) => ({ ...prev, description: text }));
  }, []);

  const handleDatePress = useCallback(() => {
    if (!isLoading) setShowDatePicker(true);
  }, [isLoading]);

  // Move ALL useMemo hooks here, before any conditional returns
  // Memoize the account list rendering
  const renderAccounts = useMemo(() => {
    if (accounts.length === 0) {
      return (
        <Text style={styles.noAccountsText}>
          No accounts available. Please add accounts in Settings.
        </Text>
      );
    }

    return (
      <View style={styles.iconsSliderContainer}>
        <FlatList
          data={accounts}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.iconSliderItem,
                selectedAccountIndex === index && styles.selectedIconItem,
              ]}
              onPress={
                isLoading
                  ? undefined
                  : () => handleAccountSelection(item.id, index)
              }
              disabled={isLoading}
            >
              <View
                style={[
                  styles.iconBubble,
                  { backgroundColor: "#333" },
                  selectedAccountIndex === index && styles.selectedIconBubble,
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
    );
  }, [accounts, selectedAccountIndex, isLoading, handleAccountSelection]);

  // Memoize category rendering
  const renderCategories = useMemo(() => {
    if (formData.type !== "Expenses") return null;

    return (
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.iconsSliderContainer}>
          <FlatList
            data={CATEGORY_ICONS}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.iconSliderItem,
                  selectedCategoryIndex === index && styles.selectedIconItem,
                ]}
                onPress={
                  isLoading
                    ? undefined
                    : () => handleCategorySelection(item.label, index)
                }
                disabled={isLoading}
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
    );
  }, [
    formData.type,
    selectedCategoryIndex,
    isLoading,
    handleCategorySelection,
  ]);

  const handleSave = async () => {
    if (!formData.amount || !formData.accountId) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setIsLoading(true);
    try {
      const account = accounts.find((acc) => acc.id === formData.accountId);
      if (!account) {
        Alert.alert("Error", "Account not found.");
        return;
      }

      const oldAmount = Math.abs(transaction.amount || 0);
      const newAmount = amountValue;
      const oldType = transaction.type;
      const newType = formData.type;

      let balanceAdjustment = 0;
      let incomeAdjustment = 0;
      let expenseAdjustment = 0;

      // Reverse the old transaction's effect
      if (oldType === "Income") {
        balanceAdjustment -= oldAmount;
        incomeAdjustment -= oldAmount;
      } else {
        balanceAdjustment += oldAmount;
        expenseAdjustment -= oldAmount;
      }

      // Apply the new transaction's effect
      if (newType === "Income") {
        balanceAdjustment += newAmount;
        incomeAdjustment += newAmount;
      } else {
        balanceAdjustment -= newAmount;
        expenseAdjustment += newAmount;
      }

      const currentBalance = account.currentBalance || 0;
      const totalIncome = account.totalIncome || 0;
      const totalExpenses = account.totalExpenses || 0;

      const newCurrentBalance = currentBalance + balanceAdjustment;
      const newTotalIncome = Math.max(0, totalIncome + incomeAdjustment);
      const newTotalExpenses = Math.max(0, totalExpenses + expenseAdjustment);

      let accountUpdateData = {
        currentBalance: newCurrentBalance,
      };

      if (account.type === "income_tracker") {
        accountUpdateData.totalIncome = newTotalIncome;
        accountUpdateData.totalExpenses = newTotalExpenses;
      }

      const accountRef = doc(
        firestore,
        "users",
        user.uid,
        "accounts",
        formData.accountId
      );
      await updateDoc(accountRef, accountUpdateData);

      const transactionRef = doc(
        firestore,
        "users",
        user.uid,
        "transactions",
        transaction.id
      );

      // IMPORTANT: Preserve the original date format
      const dateToSave =
        formData.date instanceof Date
          ? formData.date.toISOString()
          : formData.date;

      await updateDoc(transactionRef, {
        amount: amountValue,
        description: formData.description,
        category: formData.category,
        type: newType,
        accountId: formData.accountId,
        date: dateToSave,
        updatedAt: serverTimestamp(), // Only update this, preserve createdAt
      });

      // Clear insights cache after successful update
      try {
        await AsyncStorage.removeItem(`@budgetwise_insights_${user.uid}`);
      } catch (e) {
        console.log("Cache clear failed:", e);
      }

      // Clean up empty categories - check if the old category became empty
      // Only cleanup if the category actually changed and it was an expense transaction
      const oldCategory = transaction.category;
      const categoryChanged = oldCategory !== formData.category;
      const wasExpenseTransaction = oldType === "Expenses";

      if (categoryChanged && wasExpenseTransaction && oldCategory) {
        console.log("[Edit Transaction] Category changed from", oldCategory, "to", formData.category);
        await cleanupEmptyCategories(user.uid, [oldCategory]);
      }

      Alert.alert("Success", "Transaction updated successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Error", "Failed to update transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (_, selectedDate) => {
    const currentDate = selectedDate || formData.date;
    setShowDatePicker(Platform.OS === "ios");
    setFormData({ ...formData, date: currentDate });
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "Select Date";
    return dateObj.toLocaleDateString();
  };

  // Show loading until form is initialized
  if (!transaction || !isFormInitialized) {
    return (
      <ScreenWrapper backgroundColor={COLORS.white}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Edit Transaction</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {!transaction ? "Transaction not found" : "Loading transaction..."}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Edit Transaction</Text>
        </View>

        <Text style={styles.subText}>
          You may edit your transaction here. Make sure to fill all fields as
          they improve your overall experience in our application
        </Text>

        <View style={styles.toggleWrapper}>
          <ToggleSwitch
            key={toggleKey}
            onToggle={handleToggle}
            disabled={isLoading}
            initialType={formData.type}
          />
        </View>

        <ScrollView style={styles.formContainer} scrollEnabled={!isLoading}>
          <InputField
            title="Amount"
            value={formData.amount}
            onChangeText={handleAmountChange}
            editable={!isLoading}
            enableValidation={true}
          />

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.dateInputRow}>
              <TouchableOpacity
                onPress={handleDatePress}
                style={styles.datePickerTouchable}
                disabled={isLoading}
              >
                <Text style={styles.datePickerText}>
                  {formatDate(formData.date)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lineContainer}>
              <View style={styles.line} />
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              onChange={onDateChange}
              accentColor={COLORS.primary}
              backgroundColor={COLORS.lightGray}
              display="default"
            />
          )}

          <InputField
            title="Description"
            value={formData.description}
            onChangeText={handleDescriptionChange}
            editable={!isLoading}
            enableValidation={true}
          />

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Account</Text>
            {renderAccounts}
          </View>

          {renderCategories}

          <View style={styles.buttonWrapper}>
            <CustomButton
              title="Update Transaction"
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

// Styles copied exactly from AddTransactions.js
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  title: {
    fontSize: SIZES.font.xlarge,
    marginLeft: SIZES.padding.xlarge,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    marginLeft: 45,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.xxlarge,
  },
  errorText: {
    fontSize: SIZES.font.medium,
    color: COLORS.danger,
    fontFamily: "Poppins-Regular",
    textAlign: "center",
  },
  noAccountsText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: SIZES.padding.large,
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
});

export default EditTransactionScreen;
