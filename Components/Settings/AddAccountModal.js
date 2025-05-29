import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  firestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "../../firebase/firebaseConfig";
import SelectionModal from "../SelectionModel";
import { COLORS, ACCOUNT_TYPES, SIZES, SHADOWS } from "../../constants/theme";

const validateInput = (value, type = "text") => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (type === "number") {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  return true;
};

const getLabelFromValue = (options, value) => {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : "Select...";
};

const LabeledInput = ({ label, error, ...props }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={COLORS.gray}
      {...props}
    />
    {error ? (
      <View style={styles.errorRow}>
        <Ionicons
          name="alert-circle"
          size={16}
          color={COLORS.danger}
          style={{ marginRight: 4 }}
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null}
  </>
);

const AddAccountModal = ({
  isVisible,
  onClose,
  user,
  setIsLoading: setParentLoading,
  isLoading,
  onSuccess,
}) => {
  const titleInputRef = useRef(null);
  const initialBalanceInputRef = useRef(null);
  const savingGoalInputRef = useRef(null);

  const [isAccountTypeModalVisible, setAccountTypeModalVisible] =
    useState(false);
  const [accountTitle, setAccountTitle] = useState("");
  const [accountType, setAccountType] = useState(ACCOUNT_TYPES[0].value);
  const [initialBalance, setInitialBalance] = useState("");
  const [savingGoal, setSavingGoal] = useState("");
  const [accountTitleError, setAccountTitleError] = useState("");
  const [initialBalanceError, setInitialBalanceError] = useState("");
  const [savingGoalError, setSavingGoalError] = useState("");

  useEffect(() => {
    if (isVisible) {
      resetAccountForm();
      setTimeout(() => titleInputRef.current?.focus(), 300);
    }
  }, [isVisible]);

  const resetAccountForm = useCallback(() => {
    setAccountTitle("");
    setAccountType(ACCOUNT_TYPES[0].value);
    setInitialBalance("");
    setSavingGoal("");
    setAccountTitleError("");
    setInitialBalanceError("");
    setSavingGoalError("");
    setAccountTypeModalVisible(false);
    Keyboard.dismiss();
  }, []);

  const handleClose = () => {
    if (!isLoading) {
      resetAccountForm();
      onClose();
    }
  };

  const handleAccountTitleChange = (text) => {
    setAccountTitle(text);
    if (accountTitleError) setAccountTitleError("");
  };

  const handleInitialBalanceChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    const parts = cleanedText.split(".");
    const formattedText =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleanedText;

    setInitialBalance(formattedText);
    if (initialBalanceError) setInitialBalanceError("");
  };

  const handleSavingGoalChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    const parts = cleanedText.split(".");
    const formattedText =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : cleanedText;

    setSavingGoal(formattedText);
    if (savingGoalError) setSavingGoalError("");
  };

  const checkDuplicateAccount = async (title) => {
    if (!user) return false;
    const trimmedTitle = title.trim();
    const accountsRef = collection(firestore, "users", user.uid, "accounts");
    const q = query(accountsRef, where("title", "==", trimmedTitle));

    try {
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking for duplicate account:", error);
      return false;
    }
  };

  const handleAccountTypeSelect = (value) => {
    setAccountType(value);
    setAccountTypeModalVisible(false);

    setTimeout(() => {
      if (value === "balance") {
        initialBalanceInputRef.current?.focus();
      } else if (value === "savings_goal") {
        savingGoalInputRef.current?.focus();
      }
    }, 300);
  };

  const isFormValid = useMemo(() => {
    if (!accountTitle.trim()) return false;
    if (accountType === "balance" && !initialBalance) return false;
    if (accountType === "savings_goal" && !savingGoal) return false;
    return true;
  }, [accountTitle, accountType, initialBalance, savingGoal]);

  const handleSaveAccount = async () => {
    Keyboard.dismiss();

    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    let isValid = true;
    setAccountTitleError("");
    setInitialBalanceError("");
    setSavingGoalError("");

    const trimmedTitle = accountTitle.trim();

    if (!trimmedTitle) {
      setAccountTitleError("Please enter an account title.");
      titleInputRef.current?.focus();
      isValid = false;
    }

    if (accountType === "balance" && !initialBalance) {
      setInitialBalanceError("Please enter a valid initial balance.");
      if (isValid) initialBalanceInputRef.current?.focus();
      isValid = false;
    }

    if (accountType === "savings_goal" && !savingGoal) {
      setSavingGoalError("Please enter a valid saving goal amount.");
      if (isValid) savingGoalInputRef.current?.focus();
      isValid = false;
    }

    if (!isValid) return;

    setParentLoading(true);

    try {
      const isDuplicate = await checkDuplicateAccount(trimmedTitle);
      if (isDuplicate) {
        setAccountTitleError(
          `An account named "${trimmedTitle}" already exists.`
        );
        titleInputRef.current?.focus();
        setParentLoading(false);
        return;
      }

      // After validation, prepare the account data with proper initialization of all fields
      const accountData = {
        userId: user.uid,
        title: trimmedTitle,
        type: accountType,
        createdAt: serverTimestamp(),
        currentBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        savingGoalTarget: 0,
        backgroundColor: getAccountTypeColor(accountType),
        amountColor: accountType === "income_tracker" ? "lightgreen" : "white",
      };

      // Set type-specific initial values
      if (accountType === "balance") {
        accountData.currentBalance = parseFloat(initialBalance) || 0;
      } else if (accountType === "income_tracker") {
        // For income tracker, we need to initialize all tracking fields
        accountData.currentBalance = parseFloat(initialBalance) || 0;
        accountData.totalIncome =
          accountData.currentBalance > 0 ? accountData.currentBalance : 0;
        accountData.totalExpenses = 0;
      } else if (accountType === "savings_goal") {
        accountData.savingGoalTarget = parseFloat(savingGoal) || 0;
        accountData.currentBalance = parseFloat(initialBalance) || 0;
      }

      await addDoc(
        collection(firestore, "users", user.uid, "accounts"),
        accountData
      );
      Alert.alert("Success", "Account added successfully!");
      resetAccountForm();
      onClose();
      if (onSuccess) {
        onSuccess(); // Call the success callback to refresh the parent
      }
    } catch (error) {
      console.error("Error adding account: ", error);
      Alert.alert("Error", `Could not add account. ${error.message}`);
    } finally {
      setParentLoading(false);
    }
  };

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
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Account</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LabeledInput
              label="Account Title *"
              error={accountTitleError}
              value={accountTitle}
              onChangeText={handleAccountTitleChange}
              placeholder="e.g., Main Checking, Holiday Fund"
              maxLength={30}
              returnKeyType="next"
              onSubmitEditing={() => setAccountTypeModalVisible(true)}
            />

            <Text style={styles.label}>Account Type *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setAccountTypeModalVisible(true)}
              disabled={isLoading}
            >
              <View style={styles.selectButtonContent}>
                <View
                  style={[
                    styles.accountTypeIcon,
                    { backgroundColor: "#F3F4F6" },
                  ]}
                >
                  <Ionicons
                    name={getAccountTypeIcon(accountType)}
                    size={16}
                    color="#333"
                  />
                </View>
                <Text style={styles.selectButtonText}>
                  {getLabelFromValue(ACCOUNT_TYPES, accountType)}
                </Text>
              </View>
              <Ionicons
                name="chevron-down-outline"
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>

            {accountType === "balance" && (
              <>
                <LabeledInput
                  label="Initial Balance *"
                  error={initialBalanceError}
                  value={initialBalance}
                  onChangeText={handleInitialBalanceChange}
                  placeholder="Enter initial balance"
                  keyboardType="numeric"
                />
              </>
            )}

            {accountType === "savings_goal" && (
              <>
                <LabeledInput
                  label="Saving Goal *"
                  error={savingGoalError}
                  value={savingGoal}
                  onChangeText={handleSavingGoalChange}
                  placeholder="Enter saving goal amount"
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                (!isFormValid || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSaveAccount}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  Save Account
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <SelectionModal
        isVisible={isAccountTypeModalVisible}
        options={ACCOUNT_TYPES}
        selectedValue={accountType}
        onSelect={handleAccountTypeSelect}
        onClose={() => setAccountTypeModalVisible(false)}
        title="Select Account Type"
      />
    </Modal>
  );
};

const getAccountTypeIcon = (type) => {
  switch (type) {
    case "balance":
      return "wallet-sharp"; // More defined wallet icon for balance tracking
    case "income_tracker":
      return "stats-chart"; // Chart icon better represents income/expense tracking
    case "savings_goal":
      return "trophy"; // Trophy icon represents achieving a savings goal
    default:
      return "wallet-sharp";
  }
};

const getAccountTypeColor = (type) => {
  switch (type) {
    case "balance":
      return "#012249";
    case "income_tracker":
      return "#2F2F42";
    case "savings_goal":
      return "#AF7700";
    default:
      return "#012249";
  }
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius.large,
    borderTopRightRadius: SIZES.radius.large,
    alignItems: "center",
    ...SHADOWS.medium,
    elevation: 10,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingTop: SIZES.padding.large,
    paddingBottom: SIZES.padding.small,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
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
    width: "100%",
    paddingHorizontal: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.small,
  },
  label: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Medium",
    color: COLORS.darkGray,
    marginBottom: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  input: {
    height: 50,
    width: "100%",
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: SIZES.padding.medium,
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
    backgroundColor: COLORS.lightGrayBackground,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Regular",
    color: COLORS.danger,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 4,
  },
  selectButton: {
    height: 50,
    width: "100%",
    borderColor: COLORS.lightGray,
    borderWidth: 1,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: 15,
    backgroundColor: COLORS.lightGrayBackground,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  selectButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  selectButtonText: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.xlarge,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
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
    opacity: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
});

export default AddAccountModal;
