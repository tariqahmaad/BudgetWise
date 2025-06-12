// Create a new file: ManageAccountsScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  doc,
  query,
  where,
} from "firebase/firestore";
import { auth, firestore } from "../../firebase/firebaseConfig";
import { COLORS, SIZES } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import AddAccountModal from "../../Components/Settings/AddAccountModal";
import EditAccountModal from "../../Components/Settings/EditAccountModal";
import DeleteAccountConfirmationModal from "../../Components/Settings/DeleteAccountConfirmationModal";

const ManageAccountsScreen = () => {
  const navigation = useNavigation();
  const [accounts, setAccounts] = useState([]);
  const [isAddAccountModalVisible, setIsAddAccountModalVisible] =
    useState(false);
  const [isEditAccountModalVisible, setIsEditAccountModalVisible] =
    useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [transactionsToDelete, setTransactionsToDelete] = useState([]);
  const user = auth.currentUser;

  const accountTypes = ["balance", "income_tracker", "savings_goal"];
  const maxAccounts = 3;

  const fetchAccounts = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const accountsRef = collection(firestore, "users", user.uid, "accounts");
      const accountsSnapshot = await getDocs(accountsRef);

      const accountsData = accountsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched accounts:", accountsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      Alert.alert("Error", "Failed to fetch accounts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user, fetchAccounts]);

  const canAddAccount = () => {
    // Check if we've reached max accounts OR if all account types are taken
    const availableTypes = getAvailableAccountTypes();
    return accounts.length < maxAccounts && availableTypes.length > 0;
  };

  const getAvailableAccountTypes = () => {
    const existingTypes = accounts.map((acc) => acc.type);
    return accountTypes.filter((type) => !existingTypes.includes(type));
  };

  const accountIcon = useCallback((type) => {
    switch (type) {
      case "balance":
        return "wallet-outline";
      case "income_tracker":
        return "trending-up-outline";
      case "savings_goal":
        return "save-outline";
      default:
        return "wallet-outline";
    }
  }, []);

  const formatAmount = (account) => {
    if (account.type === "savings_goal") {
      const current = account.currentAmount || account.currentBalance || 0;
      const goal = account.savingGoalTarget || account.goalAmount || 0;
      return `$${current.toFixed(2)} / $${goal.toFixed(2)}`;
    }
    const amount = account.currentBalance || account.amount || 0;
    return `$${amount.toFixed(2)}`;
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setIsEditAccountModalVisible(true);
  };

  const handleEditSuccess = () => {
    setIsEditAccountModalVisible(false);
    setEditingAccount(null);
    fetchAccounts(); // Refresh accounts after edit
  };

  const handleAddSuccess = () => {
    setIsAddAccountModalVisible(false);
    fetchAccounts(); // Refresh accounts after adding
  };

  const handleAddAccountPress = () => {
    const availableTypes = getAvailableAccountTypes();

    if (accounts.length >= maxAccounts) {
      Alert.alert(
        "Maximum Accounts Reached",
        `You can only have a maximum of ${maxAccounts} accounts.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (availableTypes.length === 0) {
      Alert.alert(
        "All Account Types Used",
        "You already have one account of each type. You can only have one Balance Account, one Income Tracker, and one Savings Goal.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsAddAccountModalVisible(true);
  };

  const confirmDelete = useCallback(
    async (account) => {
      if (!user) return;
      setIsLoading(true);

      try {
        const transactionsRef = collection(
          firestore,
          "users",
          user.uid,
          "transactions"
        );
        const q = query(transactionsRef, where("accountId", "==", account.id));
        const querySnapshot = await getDocs(q);

        // Extract data immediately to avoid conflicts
        const linkedTransactionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAccountToDelete(account);
        setTransactionsToDelete(linkedTransactionsData);
        setIsDeleteModalVisible(true);
      } catch (error) {
        console.error("Error checking for linked transactions:", error);
        Alert.alert(
          "Error",
          "Could not check for linked transactions. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case "balance":
        return "Balance Account";
      case "income_tracker":
        return "Income Tracker";
      case "savings_goal":
        return "Savings Goal";
      default:
        return type.replace("_", " ");
    }
  };

  const getAddButtonText = () => {
    const availableTypes = getAvailableAccountTypes();
    const remainingSlots = maxAccounts - accounts.length;

    if (accounts.length >= maxAccounts) {
      return "Maximum accounts reached";
    }

    if (availableTypes.length === 0) {
      return "All account types used";
    }

    return "Add New Account";
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.leftContainer}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.headerTitle}>Manage Accounts</Text>
          </View>
          <View style={styles.rightContainer}>
            {canAddAccount() && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddAccountPress}
                disabled={isLoading}
              >
                <Ionicons name="add" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>
            You can have up to {maxAccounts} accounts, one of each type: Balance
            Account, Income Tracker, and Savings Goal.
          </Text>

          <View style={styles.accountsContainer}>
            {accounts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="wallet-outline"
                  size={48}
                  color={COLORS.lightGray}
                />
                <Text style={styles.emptyText}>No accounts added yet</Text>
                <Text style={styles.emptySubtext}>
                  Add your first account to get started
                </Text>
              </View>
            ) : (
              accounts.map((acc, index) => (
                <View
                  key={acc.id}
                  style={[
                    styles.accountItemContainer,
                    index === accounts.length - 1 && styles.lastAccountItem,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.accountItem}
                    onPress={() => handleEditAccount(acc)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.accountIconContainer}>
                      <Ionicons
                        name={accountIcon(acc.type)}
                        size={24}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountTitle}>{acc.title}</Text>
                      <Text style={styles.accountType}>
                        {getAccountTypeLabel(acc.type)}
                      </Text>
                      <Text style={styles.accountAmount}>
                        {formatAmount(acc)}
                      </Text>
                    </View>
                    <View style={styles.accountActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditAccount(acc)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => confirmDelete(acc)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {canAddAccount() ? (
            <TouchableOpacity
              style={styles.addAccountButton}
              onPress={handleAddAccountPress}
              disabled={isLoading}
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.addAccountText}>{getAddButtonText()}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.limitContainer}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.gray}
              />
              <Text style={styles.limitText}>
                {accounts.length >= maxAccounts
                  ? `You've reached the maximum limit of ${maxAccounts} accounts`
                  : "You already have one account of each type"}
              </Text>
            </View>
          )}
        </ScrollView>

        <AddAccountModal
          isVisible={isAddAccountModalVisible}
          onClose={() => setIsAddAccountModalVisible(false)}
          user={user}
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          availableTypes={getAvailableAccountTypes()}
          onSuccess={handleAddSuccess}
        />

        <EditAccountModal
          isVisible={isEditAccountModalVisible}
          onClose={() => {
            setIsEditAccountModalVisible(false);
            setEditingAccount(null);
          }}
          account={editingAccount}
          user={user}
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          onSuccess={handleEditSuccess}
        />

        <DeleteAccountConfirmationModal
          isVisible={isDeleteModalVisible}
          onClose={() => setIsDeleteModalVisible(false)}
          onSuccess={() => {
            setIsDeleteModalVisible(false);
            setAccountToDelete(null);
            setTransactionsToDelete([]);
            fetchAccounts(); // Refresh the accounts list
          }}
          account={accountToDelete}
          linkedTransactions={transactionsToDelete}
          user={user}
          firestore={firestore}
        />
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
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    paddingVertical: SIZES.padding.xxlarge,
    backgroundColor: COLORS.white,
  },
  leftContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerContainer: {
    flex: 4,
    alignItems: "center",
  },
  rightContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGrayBackground,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  accountsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    overflow: "hidden",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: COLORS.gray,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.lightGray,
    marginTop: 8,
    textAlign: "center",
  },
  accountItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrayBackground,
  },
  lastAccountItem: {
    borderBottomWidth: 0,
  },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
  },
  accountIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGrayBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.gray,
    marginBottom: 4,
  },
  accountAmount: {
    fontSize: 15,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary,
  },
  accountActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lightGrayBackground,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#FFE5E5",
  },
  addAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: COLORS.lightGrayBackground,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderStyle: "dashed",
  },
  addAccountText: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary,
    marginLeft: 8,
  },
  limitContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.lightGrayBackground,
    borderRadius: 12,
    marginBottom: 20,
  },
  limitText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.gray,
    marginLeft: 8,
    textAlign: "center",
    flex: 1,
  },
});

export default ManageAccountsScreen;
