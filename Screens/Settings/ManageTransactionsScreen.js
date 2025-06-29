// ManageTransactionsScreen.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  auth,
  firestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  updateDoc,
} from "../../firebase/firebaseConfig";
import { orderBy, limit } from "firebase/firestore";
import { COLORS, SIZES, SHADOWS, CATEGORY_ICONS } from "../../constants/theme";
import ScreenWrapper from "../../Components/ScreenWrapper";
import BackButton from "../../Components/Buttons/BackButton";
import { cleanupEmptyCategories } from "../../services/transactionService";
import { useCurrency } from "../../contexts/CurrencyContext";

// Create the map dynamically from the imported constant
const CATEGORY_ICON_MAP = CATEGORY_ICONS.reduce((map, category) => {
  map[category.label] = category.name;
  return map;
}, {});

// Color palette for transaction icons (same as SummaryScreen and HomeScreen)
const CHART_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#28B463",
  "#F39C12",
  "#8E44AD",
  "#2980B9",
];

const ManageTransactionsScreen = () => {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const { formatAmount } = useCurrency();

  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cache keys
  const CACHE_KEY = `@manage_transactions_${user?.uid}`;
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  // Load cached data first, then fetch fresh data
  const fetchTransactions = useCallback(
    async (forceRefresh = false) => {
      if (!user) return;

      if (!forceRefresh) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        // Try to load from cache first for instant display (only if not force refreshing)
        if (!forceRefresh) {
          try {
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            if (cachedData) {
              const parsed = JSON.parse(cachedData);
              const now = Date.now();

              // Check if cache is still valid
              if (parsed.timestamp && now - parsed.timestamp < CACHE_EXPIRY) {
                console.log("Loading from cache...");
                setTransactions(parsed.transactions || []);
                setFilteredTransactions(parsed.transactions || []);
                setAccounts(parsed.accounts || []);
                setIsLoading(false);
                // Still fetch fresh data in background, but don't show loading
              } else {
                console.log("Cache expired, removing...");
                await AsyncStorage.removeItem(CACHE_KEY);
              }
            }
          } catch (cacheError) {
            console.log("Cache read error:", cacheError);
          }
        }

        // Fetch fresh data from database
        console.log("Fetching fresh data from database...");

        // Fetch accounts first
        const accountsRef = collection(
          firestore,
          "users",
          user.uid,
          "accounts"
        );
        const accSnap = await getDocs(accountsRef);
        const accList = accSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch transactions from the main transactions collection
        const transactionsRef = collection(
          firestore,
          "users",
          user.uid,
          "transactions"
        );
        const txnsSnap = await getDocs(transactionsRef);
        const allTxns = txnsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Improved sorting with better date handling
        allTxns.sort((a, b) => {
          // Handle different date formats consistently
          let dateA, dateB;

          if (a.date) {
            if (a.date.toDate) {
              dateA = a.date.toDate();
            } else if (typeof a.date === "string") {
              dateA = new Date(a.date);
            } else {
              dateA = new Date(a.date);
            }
          } else {
            dateA = new Date(0);
          }

          if (b.date) {
            if (b.date.toDate) {
              dateB = b.date.toDate();
            } else if (typeof b.date === "string") {
              dateB = new Date(b.date);
            } else {
              dateB = new Date(b.date);
            }
          } else {
            dateB = new Date(0);
          }

          // Sort by date descending, then by updatedAt if dates are the same
          const timeDiff = dateB.getTime() - dateA.getTime();
          if (timeDiff === 0 && a.updatedAt && b.updatedAt) {
            const updatedA = a.updatedAt.toDate
              ? a.updatedAt.toDate()
              : new Date(a.updatedAt);
            const updatedB = b.updatedAt.toDate
              ? b.updatedAt.toDate()
              : new Date(b.updatedAt);
            return updatedB.getTime() - updatedA.getTime();
          }
          return timeDiff;
        });

        // Update state with fresh data
        setAccounts(accList);
        setTransactions(allTxns);
        setFilteredTransactions(allTxns);

        // Cache the fresh data
        try {
          const cacheData = {
            transactions: allTxns,
            accounts: accList,
            timestamp: Date.now(),
          };
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          console.log("Data cached successfully");
        } catch (cacheError) {
          console.log("Cache write error:", cacheError);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        Alert.alert("Error", "Could not load transactions.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user, CACHE_KEY]
  );

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Refresh when screen comes into focus (e.g., returning from edit screen)
  useFocusEffect(
    useCallback(() => {
      // Force refresh when coming back to screen to ensure data is up to date
      fetchTransactions(true);
    }, [fetchTransactions])
  );

  // Apply search + account filter
  useEffect(() => {
    let f = transactions;
    if (selectedAccount !== "all") {
      f = f.filter((t) => t.accountId === selectedAccount);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (t) =>
          (t.description || "").toLowerCase().includes(q) ||
          (t.category || "").toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }
    setFilteredTransactions(f);
  }, [transactions, selectedAccount, searchQuery]);

  // Clear cache function (useful for debugging or user action)
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      console.log("Cache cleared");
      fetchTransactions(true); // Force refresh after clearing cache
    } catch (error) {
      console.log("Error clearing cache:", error);
    }
  }, [CACHE_KEY, fetchTransactions]);

  // Enhanced refresh handler
  const handleRefresh = useCallback(() => {
    fetchTransactions(true); // Force refresh
  }, [fetchTransactions]);

  const formatDate = (dateVal) => {
    if (!dateVal) return "No Date";

    let date;
    if (dateVal.toDate) {
      date = dateVal.toDate();
    } else if (typeof dateVal === "string") {
      date = new Date(dateVal);
    } else {
      date = new Date(dateVal);
    }

    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
  };

  // Add this new function to format the creation time
  const formatCreatedTime = (createdAt) => {
    if (!createdAt) return "Unknown time";

    let date;
    if (createdAt.toDate) {
      date = createdAt.toDate();
    } else if (typeof createdAt === "string") {
      date = new Date(createdAt);
    } else {
      date = new Date(createdAt);
    }

    if (isNaN(date.getTime())) return "Invalid time";

    // Format with exact time including milliseconds
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Add milliseconds
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

    return `${dateStr} at ${timeStr}.${milliseconds}`;
  };

  const confirmDelete = (txn) => {
    Alert.alert(
      "Delete Transaction",
      `Delete "${txn.description || "No description"}" of ${formatAmount(Math.abs(txn.amount))}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(txn),
        },
      ]
    );
  };

  const handleDelete = useCallback(
    async (txn) => {
      setIsLoading(true);
      try {
        // Find the account to update its balance
        const account = accounts.find((acc) => acc.id === txn.accountId);
        if (!account) {
          Alert.alert("Error", "Account not found.");
          return;
        }

        // Calculate the balance adjustment based on transaction type
        let newCurrentBalance = account.currentBalance || 0;
        let newTotalIncome = account.totalIncome || 0;
        let newTotalExpenses = account.totalExpenses || 0;

        if (txn.type === "Income") {
          // Remove income: subtract from current balance and total income
          newCurrentBalance -= Math.abs(txn.amount);
          newTotalIncome -= Math.abs(txn.amount);
        } else if (txn.type === "Expenses") {
          // Remove expense: add back to current balance and subtract from total expenses
          newCurrentBalance += Math.abs(txn.amount);
          newTotalExpenses -= Math.abs(txn.amount);
        }

        // Prepare the update object based on account type
        let updateData = {
          currentBalance: newCurrentBalance,
        };

        // For income_tracker accounts, also update totals
        if (account.type === "income_tracker") {
          updateData.totalIncome = Math.max(0, newTotalIncome);
          updateData.totalExpenses = Math.max(0, newTotalExpenses);
        }

        // Update the account balance first
        const accountRef = doc(
          firestore,
          "users",
          user.uid,
          "accounts",
          txn.accountId
        );
        await updateDoc(accountRef, updateData);

        // Then delete the transaction
        await deleteDoc(
          doc(firestore, "users", user.uid, "transactions", txn.id)
        );

        // Clear cache since data changed
        await AsyncStorage.removeItem(CACHE_KEY);

        // Refresh data to show updated balances
        await fetchTransactions(true);

        // Clean up empty categories
        await cleanupEmptyCategories(user.uid);

        Alert.alert(
          "Success",
          "Transaction deleted and account balance updated."
        );
      } catch (err) {
        console.error(err);
        Alert.alert(
          "Error",
          "Failed to delete transaction or update account balance."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, fetchTransactions, accounts, CACHE_KEY]
  );

  const handleEdit = (txn) => {
    navigation.navigate("EditTransaction", {
      transaction: txn,
      accountId: txn.accountId,
    });
  };

  // List header with ONLY filters + count (no search input)
  const renderHeader = useCallback(
    () => (
      <>
        {/* Account chips */}
        <View style={styles.accountFilter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedAccount === "all" && styles.filterChipActive,
              ]}
              onPress={() => setSelectedAccount("all")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedAccount === "all" && styles.filterChipTextActive,
                ]}
              >
                All Accounts
              </Text>
            </TouchableOpacity>
            {accounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.filterChip,
                  selectedAccount === acc.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedAccount(acc.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedAccount === acc.id && styles.filterChipTextActive,
                  ]}
                >
                  {acc.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Result count */}
        <Text style={styles.resultCount}>
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? "s" : ""} found
        </Text>
      </>
    ),
    [selectedAccount, accounts, filteredTransactions]
  );

  const renderItem = ({ item }) => {
    // Create a consistent color based on category name (like HomeScreen)
    const categoryHash = (item.category || "default")
      .split("")
      .reduce((hash, char) => {
        return char.charCodeAt(0) + ((hash << 5) - hash);
      }, 0);
    const colorIndex = Math.abs(categoryHash) % CHART_COLORS.length;

    // Check if transaction has a description (like HomeScreen)
    const hasDescription = item.description && item.description.trim() !== "";

    // Handle display logic based on transaction type
    let displayName, shouldShowCategory;

    if (item.type === "Income") {
      // For income transactions: show description if available, otherwise show account name
      displayName = hasDescription
        ? item.description
        : item.accountName || accountTitle || "Income";
      // Show account name as category when there's a description
      shouldShowCategory = hasDescription;
    } else {
      // For expense transactions: show description if available, otherwise show category
      displayName = hasDescription
        ? item.description
        : item.category || "Uncategorized";
      // Show category when there's a description
      shouldShowCategory = hasDescription;
    }

    // Find account title
    const account = accounts.find((acc) => acc.id === item.accountId);
    const accountTitle = account?.title || "Unknown Account";

    // Check if created and updated times are different
    const createdTime = item.createdAt;
    const updatedTime = item.updatedAt;

    let isUpdated = false;
    if (createdTime && updatedTime) {
      // Convert both to comparable timestamps
      let createdTimestamp, updatedTimestamp;

      if (createdTime.toDate && updatedTime.toDate) {
        createdTimestamp = createdTime.toDate().getTime();
        updatedTimestamp = updatedTime.toDate().getTime();
      } else {
        createdTimestamp = new Date(createdTime).getTime();
        updatedTimestamp = new Date(updatedTime).getTime();
      }

      // Consider them different if more than 1 second apart (to account for minor timing differences)
      isUpdated = Math.abs(updatedTimestamp - createdTimestamp) > 1000;
    }

    const isExpanded = expandedTransaction === item.id;

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIcon,
                {
                  backgroundColor: CHART_COLORS[colorIndex] + "33",
                },
              ]}
            >
              <Ionicons
                name={CATEGORY_ICON_MAP[item.category] || "cash-outline"}
                size={30}
                color={COLORS.text}
              />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {displayName}
              </Text>
              {shouldShowCategory && (
                <Text style={styles.transactionCategory}>
                  {item.type === "Income"
                    ? item.accountName || accountTitle || "Account"
                    : item.category || "Uncategorized"}
                </Text>
              )}
              <Text style={styles.transactionMeta}>
                {accountTitle} • {formatDate(item.date)}
              </Text>

              {/* Show created time only if not updated, or updated time if updated */}
              {isUpdated ? (
                <TouchableOpacity
                  onPress={() =>
                    setExpandedTransaction(isExpanded ? null : item.id)
                  }
                  style={styles.timestampTouchable}
                >
                  <Text style={styles.transactionUpdatedTime}>
                    Updated: {formatCreatedTime(item.updatedAt)}
                    <Text style={styles.expandIcon}>
                      {isExpanded ? " ▼" : " ▶"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.transactionCreatedTime}>
                  Created: {formatCreatedTime(item.createdAt)}
                </Text>
              )}

              {/* Expanded section showing original created time */}
              {isUpdated && isExpanded && (
                <View style={styles.expandedTimestamp}>
                  <Text style={styles.transactionCreatedTime}>
                    Originally Created: {formatCreatedTime(item.createdAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                { color: item.type === "Income" ? "#28B463" : "#FF3B30" },
              ]}
            >
              {item.type === "Income" ? "+" : "-"}{formatAmount(Math.abs(item.amount || 0))}
            </Text>
            <View style={styles.transactionActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#E3F2FD" }]}
                onPress={() => handleEdit(item)}
              >
                <Ionicons name="pencil-outline" size={16} color="#1976D2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#FFEBEE" }]}
                onPress={() => confirmDelete(item)}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={COLORS.danger}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.lightGrayBackground}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Manage Transactions</Text>
        </View>

        {/* Enhanced Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search-outline"
              size={20}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textSecondary}
              returnKeyType="search"
              blurOnSubmit={false}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Transactions FlatList */}
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedAccount !== "all"
                  ? "Try adjusting your search or filter."
                  : "You haven't made any transactions yet."}
              </Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          contentContainerStyle={{ paddingBottom: SIZES.padding.large }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
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
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding.xxlarge,
  },
  headerTitle: {
    flex: 1,
    fontSize: SIZES.header,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
  searchContainer: {
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.medium,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding.small,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius.large,
    paddingHorizontal: SIZES.padding.large,
    paddingVertical: SIZES.padding.medium,
  },
  searchIcon: {
    marginRight: SIZES.padding.medium,
    marginLeft: SIZES.padding.medium,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
  },
  accountFilter: {
    marginBottom: SIZES.padding.medium,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius.medium,
    marginHorizontal: SIZES.padding.large,
    paddingVertical: SIZES.padding.small,
  },
  filterChip: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: SIZES.radius.large,
    paddingHorizontal: SIZES.padding.xlarge,
    paddingVertical: SIZES.padding.large,
    marginRight: SIZES.padding.medium,
    alignItems: "center",
    justifyContent: "center",
    // minWidth: 80,
  },
  filterChipActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Medium",
    color: COLORS.darkGray,
  },
  filterChipTextActive: {
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  resultCount: {
    paddingHorizontal: SIZES.padding.xxlarge,
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding.medium,
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding.small,
  },
  transactionItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding.xlarge,
    marginBottom: 1,
    paddingVertical: SIZES.padding.medium,
    paddingHorizontal: SIZES.padding.large,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.lightGray,
  },
  transactionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  transactionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginRight: SIZES.padding.medium,
  },
  transactionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SIZES.padding.large,
  },
  transactionDetails: {
    flex: 1,
    justifyContent: "center",
  },
  transactionDescription: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: SIZES.font.small,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-SemiBold",
    marginBottom: SIZES.padding.small,
  },
  transactionActions: {
    flexDirection: "row",
    gap: SIZES.padding.medium,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.small,
    elevation: 2,
  },
  transactionCreatedTime: {
    fontSize: SIZES.font.tiny || 10,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    marginTop: 2,
    opacity: 0.8,
  },
  transactionUpdatedTime: {
    fontSize: SIZES.font.tiny || 10,
    fontFamily: "Poppins-Regular",
    color: "#FF9500",
    marginTop: 2,
    opacity: 0.8,
  },
  timestampTouchable: {
    alignSelf: "flex-start",
  },
  expandIcon: {
    fontSize: 8,
    color: "#FF9500",
  },
  expandedTimestamp: {
    marginTop: SIZES.padding.small,
    paddingTop: SIZES.padding.small,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.lightGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.padding.xxxlarge,
    paddingVertical: SIZES.padding.xxxlarge,
    marginTop: 100,
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.padding.xxlarge,
    borderRadius: SIZES.radius.medium,
  },
  emptyTitle: {
    fontSize: SIZES.font.xlarge,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginTop: SIZES.padding.large,
    marginBottom: SIZES.padding.medium,
    textAlign: "center",
  },
  emptyText: {
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default ManageTransactionsScreen;
