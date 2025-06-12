import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
    ActivityIndicator,
    TextInput,
    RefreshControl,
} from "react-native";
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import {
    COLORS, CATEGORY_ICONS, SIZES

} from "../../constants/theme";
import MainCard from "../../Components/CategoryCards/MainCard";
import SubCard from "../../Components/CategoryCards/SubCard";
import { Ionicons } from "@expo/vector-icons";
import ScreenWrapper from "../../Components/ScreenWrapper";
import {
    auth,
    firestore,
    collection,
    onSnapshot,
    doc,
    getDoc,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
} from "../../firebase/firebaseConfig";
import Images from "../../constants/Images";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatAmount } from "../../utils/formatAmount";
import { cleanupEmptyCategories } from "../../services/transactionService";
import AddAccountModal from "../../Components/Settings/AddAccountModal";

// Create the map dynamically from the imported constant
const CATEGORY_ICON_MAP = CATEGORY_ICONS.reduce((map, category) => {
    map[category.label] = category.name;
    return map;
}, {});

// Color palette for transaction icons (same as SummaryScreen)
const MOCK_CHART_COLORS = [
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

// Constants for card dimensions and spacing
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const CARD_DIMENSIONS = {
    mainCard: {
        width: screenWidth * 0.9, // Match MainCard responsive width
        margin: screenWidth * 0.035, // Match MainCard responsive margin
        get totalWidth() {
            return this.width + this.margin;
        },
    },
    subCard: {
        width: screenWidth * 0.75, // Match SubCard responsive width
        margin: screenWidth * 0.035, // Match SubCard responsive margin
        get totalWidth() {
            return this.width + this.margin;
        },
    },
};

// Extracted SectionHeader component
const SectionHeader = ({ title, onPress }) => (
    <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onPress && (
            <TouchableOpacity onPress={onPress}>
                <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
        )}
    </View>
);

const HomeScreen = ({ navigation }) => {
    const [mainCardIndex, setMainCardIndex] = useState(0);
    const [subCardIndex, setSubCardIndex] = useState(0);
    const [mainCardsData, setMainCardsData] = useState([]);
    const mainCardsRef = useRef([]);
    const [refreshing, setRefreshing] = useState(false);

    // Update ref when state changes
    useEffect(() => {
        mainCardsRef.current = mainCardsData;
    }, [mainCardsData]);

    const [categoriesData, setCategoriesData] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [rawCategories, setRawCategories] = useState([]);
    const [userData, setUserData] = useState({
        name: "",
        surname: "",
        avatar: Images.profilePic,
    });

    const [transactions, setTransactions] = useState([]);

    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [newFriendName, setNewFriendName] = useState("");
    const [newFriendEmail, setNewFriendEmail] = useState("");
    const [isAddingFriend, setIsAddingFriend] = useState(false);
    const nameInputRef = useRef(null); // Ref for the name input

    const [isConnected, setIsConnected] = useState(true);

    // Add Account Modal state
    const [showAddAccountModal, setShowAddAccountModal] = useState(false);
    const [isAddingAccount, setIsAddingAccount] = useState(false);

    // Helper to get user
    const getUser = () => auth.currentUser;

    // Function to format account balances for display
    // Note: Account balances are already calculated and stored in Firebase
    // when transactions are added, so we don't need to recalculate them here
    const formatAccountsForDisplay = useCallback((accounts) => {
        // Simply return accounts with their existing balances
        // The balances are already up-to-date from Firebase
        return accounts.map((account) => ({
            ...account,
            calculatedBalance: account.currentBalance || 0,
            calculatedIncome: account.totalIncome || 0,
            calculatedExpenses: account.totalExpenses || 0,
        }));
    }, []);

    // --- ACCOUNTS ---
    useEffect(() => {
        const user = getUser();
        if (!user) {
            setAccountsLoading(false);
            return;
        }
        const cacheKey = `@budgetwise_accounts_${user.uid}`;
        let unsubscribe = null;

        const fetchAccounts = async () => {
            if (!isConnected) {
                // Offline: load from cache
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setMainCardsData(JSON.parse(cached));
                }
                setAccountsLoading(false);
                return;
            }
            setAccountsLoading(true);
            const accountsRef = collection(firestore, "users", user.uid, "accounts");
            unsubscribe = onSnapshot(
                accountsRef,
                (snapshot) => {
                    const accounts = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        // Common account data regardless of type
                        const accountData = {
                            id: doc.id,
                            title: data.title,
                            backgroundColor: data.backgroundColor || "#012249",
                            type: data.type,
                            description: "See details",
                        };

                        // Different account types have different display formats
                        switch (data.type) {
                            case "balance":
                                return {
                                    ...accountData,
                                    amount: formatAmount(data.currentBalance ?? 0),
                                    amountColor: data.amountColor || "white",
                                    Frame: require("../../assets/card-animation1.png"),
                                    extraField: [],
                                    currentBalance: data.currentBalance ?? 0,
                                };
                            case "income_tracker":
                                return {
                                    ...accountData,
                                    amount: formatAmount(data.currentBalance ?? 0),
                                    amountColor: data.amountColor || "lightgreen",
                                    Frame: require("../../assets/guy-animation.png"),
                                    extraField: [
                                        {
                                            label: "Total Income",
                                            value: formatAmount(data.totalIncome ?? 0),
                                            color: "lightgreen",
                                        },
                                        {
                                            label: "Total Expenses",
                                            value: formatAmount(data.totalExpenses ?? 0),
                                            color: "#FF7C7C",
                                        },
                                    ],
                                    currentBalance: data.currentBalance ?? 0,
                                    totalIncome: data.totalIncome ?? 0,
                                    totalExpenses: data.totalExpenses ?? 0,
                                };
                            case "savings_goal":
                                const progress =
                                    data.savingGoalTarget > 0
                                        ? Math.min(
                                            100,
                                            ((data.currentBalance ?? 0) / data.savingGoalTarget) *
                                            100
                                        )
                                        : 0;
                                return {
                                    ...accountData,
                                    amount: formatAmount(data.currentBalance ?? 0),
                                    amountColor: data.amountColor || "white",
                                    Frame: require("../../assets/money-animation.png"),
                                    extraField: [
                                        {
                                            label: "Goal",
                                            value: formatAmount(data.savingGoalTarget ?? 0),
                                            color: "#FDB347",
                                        },
                                        {
                                            label: "Progress",
                                            value: `${progress.toFixed(0)}%`,
                                            color: progress >= 100 ? "lightgreen" : "#FDB347",
                                        },
                                    ],
                                    currentBalance: data.currentBalance ?? 0,
                                    savingGoalTarget: data.savingGoalTarget ?? 0,
                                };
                            default:
                                return {
                                    ...accountData,
                                    amount: formatAmount(data.currentBalance ?? 0),
                                    amountColor: "white",
                                    Frame: require("../../assets/card-animation1.png"),
                                    extraField: [],
                                    currentBalance: data.currentBalance ?? 0,
                                };
                        }
                    });
                    setMainCardsData(accounts);
                    AsyncStorage.setItem(cacheKey, JSON.stringify(accounts)).catch(
                        () => { }
                    );
                    setAccountsLoading(false);
                },
                (error) => {
                    console.error("Error fetching accounts: ", error);
                    setAccountsLoading(false);
                }
            );
        };
        fetchAccounts();

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isConnected]);

    // --- CATEGORIES ---
    useEffect(() => {
        const user = getUser();
        if (!user) {
            setCategoriesLoading(false);
            return;
        }
        const cacheKey = `@budgetwise_categories_${user.uid}`;
        let unsubscribe = null;

        const fetchCategories = async () => {
            if (!isConnected) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setRawCategories(JSON.parse(cached));
                }
                setCategoriesLoading(false);
                return;
            }
            setCategoriesLoading(true);
            const categoriesRef = collection(
                firestore,
                "users",
                user.uid,
                "categories"
            );
            unsubscribe = onSnapshot(
                categoriesRef,
                (snapshot) => {
                    try {
                        const fetchedCategories = snapshot.docs.map((doc) => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                Category: data.name,
                                backgroundColor: data.backgroundColor || COLORS.primary,
                                iconName: data.iconName || "help-circle-outline",
                                name: data.name,
                            };
                        });
                        setRawCategories(fetchedCategories);
                        AsyncStorage.setItem(
                            cacheKey,
                            JSON.stringify(fetchedCategories)
                        ).catch(() => { });
                        setCategoriesLoading(false);
                    } catch (error) {
                        console.error("Error fetching categories:", error);
                        setCategoriesLoading(false);
                    }
                },
                (error) => {
                    console.error("Error subscribing to categories:", error);
                    setCategoriesLoading(false);
                }
            );
        };
        fetchCategories();

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isConnected]);

    // --- TRANSACTIONS ---
    useEffect(() => {
        const user = getUser();
        if (!user) return;
        const cacheKey = `@budgetwise_transactions_${user.uid}`;
        let unsubscribe = null;

        const fetchTransactions = async () => {
            if (!isConnected) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setTransactions(JSON.parse(cached));
                }
                return;
            }
            const transactionsRef = collection(
                firestore,
                "users",
                user.uid,
                "transactions"
            );
            unsubscribe = onSnapshot(
                transactionsRef,
                (snapshot) => {
                    const txns = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    // Add sophisticated sorting like ManageTransactionsScreen
                    txns.sort((a, b) => {
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

                        // Sort by date descending, then by createdAt/updatedAt if dates are the same
                        const timeDiff = dateB.getTime() - dateA.getTime();
                        if (timeDiff === 0) {
                            // Use createdAt as fallback for same-date transactions
                            const createdA = a.createdAt?.toDate
                                ? a.createdAt.toDate()
                                : new Date(a.createdAt || 0);
                            const createdB = b.createdAt?.toDate
                                ? b.createdAt.toDate()
                                : new Date(b.createdAt || 0);
                            return createdB.getTime() - createdA.getTime();
                        }
                        return timeDiff;
                    });

                    setTransactions(txns);
                    AsyncStorage.setItem(cacheKey, JSON.stringify(txns)).catch(() => { });

                    // No need to recalculate balances here since they're already updated in Firebase
                    // when transactions are added. The account balances are already correct.
                },
                (error) => {
                    console.error("Error fetching transactions:", error);
                }
            );
        };
        fetchTransactions();

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isConnected]);

    // Automatic category cleanup when data is loaded
    useEffect(() => {
        const user = getUser();
        if (!user || categoriesLoading || rawCategories.length === 0 || transactions.length === 0) {
            return;
        }

        // Cleanup empty categories automatically
        const performCleanup = async () => {
            try {
                const deletedCategories = await cleanupEmptyCategories(user.uid);
                if (deletedCategories.length > 0) {
                    console.log(`[HomeScreen] Cleaned up ${deletedCategories.length} empty categories`);
                }
            } catch (error) {
                console.error('[HomeScreen] Error during category cleanup:', error);
            }
        };

        // Debounce the cleanup to avoid running it too frequently
        const timeoutId = setTimeout(performCleanup, 2000);
        return () => clearTimeout(timeoutId);
    }, [categoriesLoading, rawCategories.length, transactions.length]);

    // --- FRIENDS ---
    const [friends, setFriends] = useState([]);
    useEffect(() => {
        const user = getUser();
        if (!user) return;
        const cacheKey = `@budgetwise_friends_${user.uid}`;
        let unsubscribe = null;

        const fetchFriends = async () => {
            if (!isConnected) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setFriends(JSON.parse(cached));
                }
                return;
            }
            const friendsRef = collection(firestore, "users", user.uid, "friends");
            unsubscribe = onSnapshot(
                friendsRef,
                (snapshot) => {
                    const fetchedFriends = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setFriends(fetchedFriends);
                    AsyncStorage.setItem(cacheKey, JSON.stringify(fetchedFriends)).catch(
                        () => { }
                    );
                },
                (error) => {
                    console.error("Error fetching friends: ", error);
                }
            );
        };
        fetchFriends();

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isConnected]);

    // --- USER DATA ---
    useEffect(() => {
        const user = getUser();
        if (!user) return;
        const cacheKey = `@budgetwise_user_${user.uid}`;
        const fetchUserData = async () => {
            if (!isConnected) {
                const cached = await AsyncStorage.getItem(cacheKey);
                if (cached) {
                    setUserData(JSON.parse(cached));
                }
                return;
            }
            try {
                const userDoc = await getDoc(doc(firestore, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const userObj = {
                        name: data.name || "",
                        surname: data.surname || "",
                        avatar: data.avatar ? { uri: data.avatar } : Images.profilePic,
                    };
                    setUserData(userObj);
                    AsyncStorage.setItem(cacheKey, JSON.stringify(userObj)).catch(
                        () => { }
                    );
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserData();
    }, [isConnected]);

    const { width } = Dimensions.get("window");

    // Memoize category data calculation based on raw categories and transactions
    const processedCategoriesData = useMemo(() => {
        // Create a map to track category totals and latest transactions
        const categoryTotals = {};
        const categoryLatestDesc = {};
        const categoryTransactionCounts = {};

        // Filter expense transactions
        const expenseTransactions = transactions.filter(
            (t) => t.type === "Expenses"
        );

        // Calculate totals for each category using the transactions state
        expenseTransactions.forEach((transaction) => {
            const category = transaction.category;
            if (category) {
                if (!categoryTotals[category]) {
                    categoryTotals[category] = 0;
                    categoryLatestDesc[category] = "";
                    categoryTransactionCounts[category] = 0;
                }
                categoryTotals[category] += transaction.amount || 0;
                categoryTransactionCounts[category]++;

                // Track latest description
                if (transaction.description) {
                    categoryLatestDesc[category] = transaction.description;
                }
            }
        });

        // Map raw categories to the final structure with calculated amounts
        const processedData = rawCategories
            .map((cat) => {
                const total = categoryTotals[cat.Category] || 0;
                const count = categoryTransactionCounts[cat.Category] || 0;
                const desc = categoryLatestDesc[cat.Category];
                let amountStr = "$0.00";
                let descriptionStr = "No spending yet";

                if (total > 0) {
                    amountStr = formatAmount(total);
                    descriptionStr = count > 1 ? `${count} expenses` : desc || "1 expense";
                }

                return {
                    id: cat.id,
                    Category: cat.Category || cat.name,
                    backgroundColor: cat.backgroundColor,
                    iconName: cat.iconName,
                    name: cat.name || cat.Category,
                    // IMPORTANT: Only use calculated amounts, ignore any stored amounts
                    amount: amountStr,
                    description: descriptionStr,
                    total: total, // Keep track of the actual total for filtering
                };
            })
            .filter((category) => category.total > 0); // Only show categories with transactions

        return processedData;
    }, [rawCategories, transactions]);

    // Memoize sorted transactions
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0); // Handle undefined dates
            const dateB = b.date ? new Date(b.date) : new Date(0); // Handle undefined dates
            return dateB - dateA;
        });
    }, [transactions]);

    // Memoized handlers
    const handleMainScroll = useCallback(
        (event) => {
            if (accountsLoading || mainCardsData.length === 0) return;
            const index = Math.round(
                event.nativeEvent.contentOffset.x / CARD_DIMENSIONS.mainCard.totalWidth
            );
            setMainCardIndex(Math.min(Math.max(index, 0), mainCardsData.length - 1));
        },
        [accountsLoading, mainCardsData.length]
    );

    const handleSubScroll = useCallback(
        (event) => {
            if (categoriesLoading || processedCategoriesData.length === 0) return;
            const index = Math.round(
                event.nativeEvent.contentOffset.x / CARD_DIMENSIONS.subCard.totalWidth
            );
            setSubCardIndex(
                Math.min(Math.max(index, 0), processedCategoriesData.length - 1)
            );
        },
        [categoriesLoading, processedCategoriesData.length]
    );

    const handleFriendPress = useCallback(
        (friend) => {
            navigation.navigate("addDebt", { friend });
        },
        [navigation]
    );

    // Memoize renderItem for MainCards
    const renderMainCardItem = useCallback(
        ({ item, index }) => (
            <MainCard {...item} isLast={index === mainCardsData.length - 1} />
        ),
        [mainCardsData.length]
    );

    // Memoize renderItem for FriendsList
    const renderFriendItem = useCallback(
        ({ item }) => (
            <TouchableOpacity
                style={styles.friendCircle}
                onPress={() => handleFriendPress(item)}
            >
                <View style={styles.friendAvatarContainer}>
                    <Ionicons
                        name="person-circle-outline"
                        size={50}
                        color={COLORS.text}
                    />
                    {item.isFavorite && (
                        <View style={styles.favoriteIndicator}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                        </View>
                    )}
                </View>
                <Text style={styles.friendName}>{item.name}</Text>
            </TouchableOpacity>
        ),
        [handleFriendPress]
    );

    const renderPaginationDots = useCallback(
        (currentIndex, total, style) => (
            <View style={[styles.paginationDots, style]}>
                {Array.from({ length: total }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentIndex ? styles.activeDot : styles.inactiveDot,
                        ]}
                    />
                ))}
            </View>
        ),
        []
    );

    // Memoize main rendering functions
    const renderMainCards = useCallback(() => {
        if (accountsLoading) {
            return (
                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                    style={styles.cardContainerHeight}
                />
            );
        }
        if (mainCardsData.length === 0) {
            return (
                <View style={[styles.cardContainerHeight, styles.emptyState]}>
                    <TouchableOpacity
                        style={styles.addAccountButton}
                        onPress={() => setShowAddAccountModal(true)}
                    >
                        <View style={styles.addAccountCircle}>
                            <Ionicons name="wallet-outline" size={40} color={COLORS.text} />
                        </View>
                        <Text style={styles.addAccountText}>Add Account</Text>
                        <Text style={styles.addAccountSubText}>
                            Create your first account to get started
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <>
                <FlatList
                    data={mainCardsData}
                    renderItem={renderMainCardItem}
                    keyExtractor={(item) => String(item.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContentContainer}
                    onScroll={handleMainScroll}
                    scrollEventThrottle={16}
                    snapToInterval={CARD_DIMENSIONS.mainCard.totalWidth}
                    decelerationRate="fast"
                    initialNumToRender={2}
                    maxToRenderPerBatch={3}
                    windowSize={5}
                />
                {mainCardsData.length > 1 &&
                    renderPaginationDots(mainCardIndex, mainCardsData.length, {
                        marginTop: 10,
                    })}
            </>
        );
    }, [
        accountsLoading,
        mainCardsData,
        mainCardIndex,
        renderMainCardItem,
        renderPaginationDots,
        showAddAccountModal,
    ]);

    // Memoize sorted friends with favorites first
    const sortedFriends = useMemo(() => {
        return [...friends].sort((a, b) => {
            // Favorites first
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            // Then by name alphabetically
            return (a.name || "").localeCompare(b.name || "");
        });
    }, [friends]);

    // Memoize filtered friends to show only favorites
    const favoriteFriends = useMemo(() => {
        return friends.filter((friend) => friend.isFavorite === true);
    }, [friends]);

    const renderFriendsSection = useCallback(
        () => (
            <>
                <SectionHeader
                    title="View your friends"
                    onPress={() => {
                        navigation.navigate("debtTracking");
                    }}
                />
                <FlatList
                    data={favoriteFriends}
                    renderItem={renderFriendItem}
                    keyExtractor={(item) => String(item.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.friendsFlatListContainer}
                    ListFooterComponent={() => (
                        <TouchableOpacity
                            style={styles.addFriendButton}
                            onPress={() => setShowAddFriendModal(true)}
                        >
                            <View style={styles.addFriendCircle}>
                                <Ionicons name="add" size={32} color={COLORS.text} />
                            </View>
                            <Text style={styles.friendName}>Add new</Text>
                        </TouchableOpacity>
                    )}
                />
            </>
        ),
        [
            sortedFriends,
            renderFriendItem,
            handleFriendPress,
            showAddFriendModal,
            setShowAddFriendModal,
            navigation,
        ]
    );

    const renderSubCards = useCallback(() => {
        if (categoriesLoading) {
            return (
                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                    style={styles.cardContainerHeight}
                />
            );
        }
        if (processedCategoriesData.length === 0) {
            return (
                <View style={styles.section}>
                    <SectionHeader title="Spending Categories" />
                    <View style={[styles.cardContainerHeight, styles.emptyState]}>
                        <Ionicons name="layers-outline" size={50} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No Categories Yet</Text>
                        <Text style={styles.emptySubText}>
                            Add spending categories in Settings to track your budget.
                        </Text>
                    </View>
                </View>
            );
        }
        return (
            <>
                <SectionHeader
                    title="Spending Categories"
                    onPress={() => navigation.navigate("Summary")}
                />
                <FlatList
                    data={processedCategoriesData}
                    renderItem={renderSubCardItem}
                    keyExtractor={(item) => String(item.id)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContentContainer}
                    onScroll={handleSubScroll}
                    scrollEventThrottle={16}
                    snapToInterval={CARD_DIMENSIONS.subCard.totalWidth}
                    decelerationRate="fast"
                    initialNumToRender={3}
                    maxToRenderPerBatch={5}
                    windowSize={7}
                />
                {processedCategoriesData.length > 1 &&
                    renderPaginationDots(subCardIndex, processedCategoriesData.length, {
                        marginTop: 10,
                    })}
            </>
        );
    }, [
        categoriesLoading,
        processedCategoriesData,
        subCardIndex,
        renderSubCardItem,
        renderPaginationDots,
        handleSubScroll,
        navigation,
    ]);

    // Memoize the renderItem for SubCards
    const renderSubCardItem = useCallback(
        ({ item, index }) => (
            <SubCard
                {...item}
                isLast={index === processedCategoriesData.length - 1}
            />
        ),
        [processedCategoriesData.length]
    );

    const renderTransactionHistory = useCallback(() => {
        if (sortedTransactions.length === 0) {
            return (
                <View style={styles.section}>
                    <SectionHeader title="Transaction History" />
                    <View style={[styles.cardContainerHeight, styles.emptyState]}>
                        <Ionicons name="receipt-outline" size={50} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No Transactions Yet</Text>
                        <Text style={styles.emptySubText}>
                            Start adding transactions to track your spending.
                        </Text>
                    </View>
                </View>
            );
        }

        // Limit to 5 transactions for home screen preview
        const limitedTransactions = sortedTransactions.slice(0, 5);

        return (
            <>
                <SectionHeader
                    title="Transaction History"
                    onPress={() => navigation.navigate("Summary")}
                />
                <View style={styles.transactionContainer}>
                    <FlatList
                        data={limitedTransactions}
                        renderItem={renderTransactionItem}
                        keyExtractor={(item) => String(item.id)}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        initialNumToRender={5}
                        maxToRenderPerBatch={5}
                        windowSize={5}
                    />
                </View>
            </>
        );
    }, [sortedTransactions, renderTransactionItem, navigation]);

    // Memoize the renderItem for Transactions
    const renderTransactionItem = useCallback(({ item }) => {
        // Create a consistent color based on category name
        const categoryHash = (item.category || "default")
            .split("")
            .reduce((hash, char) => {
                return char.charCodeAt(0) + ((hash << 5) - hash);
            }, 0);
        const colorIndex = Math.abs(categoryHash) % MOCK_CHART_COLORS.length;

        // Check if transaction has a description
        const hasDescription = item.description && item.description.trim() !== "";

        // Handle display logic based on transaction type
        let displayName, shouldShowCategory;

        if (item.type === "Income") {
            // For income transactions: show description if available, otherwise show account name
            displayName = hasDescription
                ? item.description
                : item.accountName || "Income";
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

        return (
            <View style={styles.transaction}>
                <View style={styles.transactionLeft}>
                    <View
                        style={[
                            styles.transactionIcon,
                            {
                                backgroundColor: MOCK_CHART_COLORS[colorIndex] + "33",
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
                        <Text
                            style={styles.transactionName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {displayName}
                        </Text>
                        {shouldShowCategory && (
                            <Text
                                style={styles.transactionCategory}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.type === "Income"
                                    ? item.accountName || "Account"
                                    : item.category || "Uncategorized"}
                            </Text>
                        )}
                        <Text
                            style={styles.transactionDate}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.date ? new Date(item.date).toLocaleString() : ""}
                        </Text>
                    </View>
                </View>
                <View style={styles.transactionAmountContainer}>
                    <Text
                        style={[
                            styles.transactionAmount,
                            { color: item.type === "Income" ? "green" : "#FF3B30" },
                        ]}
                        numberOfLines={1}
                    >
                        {item.amount ? formatAmount(parseFloat(item.amount), { showCents: false }) : "$0"}
                    </Text>
                </View>
            </View>
        );
    }, []);

    const handleAddFriend = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user || !newFriendName.trim() || isAddingFriend) return;
            setIsAddingFriend(true);

            await addDoc(collection(firestore, "users", user.uid, "friends"), {
                name: newFriendName.trim(),
                email: newFriendEmail.trim(),
                isFavorite: false,
                createdAt: serverTimestamp(),
            });
            setNewFriendName("");
            setNewFriendEmail("");
            setShowAddFriendModal(false);
        } catch (error) {
            console.error("Error adding friend:", error);
        } finally {
            setIsAddingFriend(false);
        }
    }, [newFriendName, newFriendEmail]);

    const handleCancelAddFriend = useCallback(() => {
        setShowAddFriendModal(false);
        setNewFriendName("");
        setNewFriendEmail("");
    }, []);

    // Account modal handlers
    const handleAddAccountSuccess = useCallback(() => {
        setShowAddAccountModal(false);
        // The data will be refreshed automatically via the useEffect with onSnapshot
    }, []);

    const handleCancelAddAccount = useCallback(() => {
        setShowAddAccountModal(false);
    }, []);

    // Effect to focus the name input when the modal becomes visible
    useEffect(() => {
        if (showAddFriendModal) {
            // Use a timeout to ensure the modal is fully rendered before focusing
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        } else {
            // Clear input values when modal is closed without adding
            setNewFriendName("");
            setNewFriendEmail("");
        }
    }, [showAddFriendModal]);

    useEffect(() => {
        const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
            setIsConnected(state.isConnected);
        });
        return () => {
            unsubscribeNetInfo();
        };
    }, []);

    // Pull-to-refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        const user = getUser();
        if (user) {
            // Refresh all data
            try {
                // Load accounts
                const accountsRef = collection(
                    firestore,
                    "users",
                    user.uid,
                    "accounts"
                );
                const accountsSnapshot = await getDocs(accountsRef);
                const accounts = accountsSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    // Common account data regardless of type
                    const accountData = {
                        id: doc.id,
                        title: data.title,
                        backgroundColor: data.backgroundColor || "#012249",
                        type: data.type,
                        description: "See details",
                    };

                    // Different account types have different display formats
                    switch (data.type) {
                        case "balance":
                            return {
                                ...accountData,
                                amount: formatAmount(data.currentBalance ?? 0),
                                amountColor: data.amountColor || "white",
                                Frame: require("../../assets/card-animation1.png"),
                                extraField: [],
                                currentBalance: data.currentBalance ?? 0,
                            };
                        case "income_tracker":
                            return {
                                ...accountData,
                                amount: formatAmount(data.currentBalance ?? 0),
                                amountColor: data.amountColor || "lightgreen",
                                Frame: require("../../assets/guy-animation.png"),
                                extraField: [
                                    {
                                        label: "Total Income",
                                        value: formatAmount(data.totalIncome ?? 0),
                                        color: "lightgreen",
                                    },
                                    {
                                        label: "Total Expenses",
                                        value: formatAmount(data.totalExpenses ?? 0),
                                        color: "#FF7C7C",
                                    },
                                ],
                                currentBalance: data.currentBalance ?? 0,
                                totalIncome: data.totalIncome ?? 0,
                                totalExpenses: data.totalExpenses ?? 0,
                            };
                        case "savings_goal":
                            const progress =
                                data.savingGoalTarget > 0
                                    ? Math.min(
                                        100,
                                        ((data.currentBalance ?? 0) / data.savingGoalTarget) * 100
                                    )
                                    : 0;
                            return {
                                ...accountData,
                                amount: formatAmount(data.currentBalance ?? 0),
                                amountColor: data.amountColor || "white",
                                Frame: require("../../assets/money-animation.png"),
                                extraField: [
                                    {
                                        label: "Goal",
                                        value: formatAmount(data.savingGoalTarget ?? 0),
                                        color: "#FDB347",
                                    },
                                    {
                                        label: "Progress",
                                        value: `${progress.toFixed(0)}%`,
                                        color: progress >= 100 ? "lightgreen" : "#FDB347",
                                    },
                                ],
                                currentBalance: data.currentBalance ?? 0,
                                savingGoalTarget: data.savingGoalTarget ?? 0,
                            };
                        default:
                            return {
                                ...accountData,
                                amount: formatAmount(data.currentBalance ?? 0),
                                amountColor: "white",
                                Frame: require("../../assets/card-animation1.png"),
                                extraField: [],
                                currentBalance: data.currentBalance ?? 0,
                            };
                    }
                });
                setMainCardsData(accounts);

                // Load categories
                const categoriesRef = collection(
                    firestore,
                    "users",
                    user.uid,
                    "categories"
                );
                const categoriesSnapshot = await getDocs(categoriesRef);
                const fetchedCategories = categoriesSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        Category: data.name,
                        backgroundColor: data.backgroundColor || COLORS.primary,
                        iconName: data.iconName || "help-circle-outline",
                        name: data.name,
                    };
                });
                setRawCategories(fetchedCategories);

                // Load transactions
                const transactionsRef = collection(
                    firestore,
                    "users",
                    user.uid,
                    "transactions"
                );
                const transactionsSnapshot = await getDocs(transactionsRef);
                const txns = transactionsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTransactions(txns);

                // Load friends
                const friendsRef = collection(firestore, "users", user.uid, "friends");
                const friendsSnapshot = await getDocs(friendsRef);
                const fetchedFriends = friendsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setFriends(fetchedFriends);

                // Load user data
                const userDoc = await getDoc(doc(firestore, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        name: data.name || "",
                        surname: data.surname || "",
                        avatar: data.avatar ? { uri: data.avatar } : Images.profilePic,
                    });
                }
            } catch (error) {
                console.error("Error refreshing data:", error);
            }
        }

        setRefreshing(false);
    }, []);

    return (
        <ScreenWrapper backgroundColor={COLORS.appBackground}>
            <View style={styles.container}>
                {/* User Profile */}
                <View style={styles.profileSection}>
                    <View style={styles.profileContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                            {userData.avatar ? (
                                <Image
                                    source={userData.avatar}
                                    style={[styles.profileImage, { borderRadius: 20 }]}
                                />
                            ) : (
                                <Ionicons
                                    name="person-circle-outline"
                                    size={40}
                                    color={COLORS.text}
                                    style={styles.profileImage}
                                />
                            )}
                        </TouchableOpacity>
                        <View style={styles.welcomeTextContainer}>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.userName}>
                                {userData.name && userData.surname
                                    ? `${userData.name} ${userData.surname}`
                                    : "User"}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notificationContainer}>
                        <Ionicons
                            name="notifications-outline"
                            size={34}
                            color={COLORS.text}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                >
                    {renderMainCards()}
                    {renderFriendsSection()}
                    {renderSubCards()}
                    {renderTransactionHistory()}
                    <View style={styles.bottomPadding} />
                </ScrollView>

                <NavigationBar />
            </View>

            {showAddFriendModal && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Add New Friend</Text>
                        <TextInput
                            placeholder="Name"
                            placeholderTextColor="#7E848D"
                            value={newFriendName}
                            onChangeText={setNewFriendName}
                            style={styles.modalInput}
                            ref={nameInputRef}
                        />
                        <TextInput
                            placeholder="Email"
                            placeholderTextColor="#7E848D"
                            value={newFriendEmail}
                            onChangeText={setNewFriendEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.modalInput}
                        />
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.modalButtonPrimary,
                                    (isAddingFriend ||
                                        !newFriendName.trim() ||
                                        !newFriendEmail.trim()) &&
                                    styles.modalButtonDisabled,
                                ]}
                                onPress={handleAddFriend}
                                disabled={
                                    isAddingFriend ||
                                    !newFriendName.trim() ||
                                    !newFriendEmail.trim()
                                }
                            >
                                {isAddingFriend ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text
                                        style={[
                                            styles.modalButtonText,
                                            styles.modalButtonTextPrimary,
                                            (isAddingFriend ||
                                                !newFriendName.trim() ||
                                                !newFriendEmail.trim()) &&
                                            styles.modalButtonTextDisabled,
                                        ]}
                                    >
                                        Add
                                    </Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={handleCancelAddFriend}
                            >
                                <Text
                                    style={[
                                        styles.modalButtonText,
                                        styles.modalButtonTextSecondary,
                                    ]}
                                >
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {showAddAccountModal && (
                <AddAccountModal
                    isVisible={showAddAccountModal}
                    onClose={handleCancelAddAccount}
                    user={getUser()}
                    setIsLoading={setIsAddingAccount}
                    isLoading={isAddingAccount}
                    onSuccess={handleAddAccountSuccess}
                />
            )}
        </ScreenWrapper>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.appBackground,
    },
    profileContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 10,
    },
    profileImage: {
        width: 50,
        height: 50,
        marginRight: 15,
    },
    welcomeTextContainer: {
        flexDirection: "column",
    },
    welcomeText: {
        fontSize: 14,
        color: "#7E848D",
        fontFamily: "Poppins-Regular",
    },
    userName: {
        fontSize: 18,
        color: COLORS.text,
        fontFamily: "Poppins-SemiBold",
    },
    notificationContainer: {
        padding: 8,
    },
    scrollContainer: {
        flex: 1,
    },
    flatListContentContainer: {
        paddingHorizontal: 20,
    },
    sectionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 13,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        color: COLORS.text,
        fontFamily: "Poppins-SemiBold",
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.active,
        fontFamily: "Poppins-Medium",
    },
    friendsFlatListContainer: {
        paddingHorizontal: 20,
        alignItems: "flex-start",
    },
    friendCircle: {
        alignItems: "center",
        marginRight: 16,
    },
    friendAvatarContainer: {
        position: "relative",
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#F8F8F8",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    favoriteIndicator: {
        position: "absolute",
        top: -2,
        right: -2,
        backgroundColor: "#FFF",
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    friendName: {
        fontSize: 13,
        color: COLORS.text,
        fontFamily: "Poppins-Medium",
    },
    addFriendButton: {
        alignItems: "center",
        marginRight: 20,
    },
    addFriendCircle: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: "transparent",
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.text,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    transactionContainer: {
        paddingHorizontal: SIZES.padding.small,
        marginTop: SIZES.padding.small,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    seeAllButton: {
        color: COLORS.active,
        fontSize: 14,
        fontFamily: "Poppins-Medium",
    },
    transactionGroup: {
        marginBottom: 16,
    },
    transactionDate: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
        fontFamily: "Poppins-Medium",
    },
    transaction: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1, // Allow it to take available space
        marginRight: 12, // Space between left content and amount
    },
    transactionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        flexShrink: 0, // Prevent icon from shrinking
    },
    transactionDetails: {
        flex: 1, // Take remaining space but allow shrinking
        justifyContent: "center",
        minWidth: 0, // Allow text to shrink below its content size
    },
    transactionName: {
        fontSize: 16,
        color: "#000",
        fontFamily: "Poppins-Medium",
        marginBottom: 2,
    },
    transactionCategory: {
        fontSize: 12,
        color: "#666",
        fontFamily: "Poppins-Regular",
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: "#666",
        fontFamily: "Poppins-Regular",
    },
    transactionAmountContainer: {
        alignItems: "flex-end",
        flexShrink: 0, // Prevent amount from shrinking
        minWidth: 80, // Ensure minimum space for amount
    },
    transactionAmount: {
        fontSize: 16,
        fontFamily: "Poppins-SemiBold",
        textAlign: "right",
    },
    bottomPadding: {
        height: 80,
    },
    paginationDots: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: COLORS.primary,
        width: 24,
    },
    inactiveDot: {
        backgroundColor: "#0066FF",
        opacity: 0.3,
    },
    cardContainerHeight: {
        minHeight: 200,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {},
    emptyState: {
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        color: COLORS.text,
        fontFamily: "Poppins-SemiBold",
        marginBottom: 8,
        textAlign: "center",
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.gray,
        fontFamily: "Poppins-Regular",
        textAlign: "center",
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        padding: 25,
        borderRadius: 20,
        width: "100%",
        maxWidth: 400,
        elevation: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: "Poppins-SemiBold",
        color: COLORS.text,
        marginBottom: 25,
        textAlign: "center",
    },
    modalInput: {
        fontFamily: "Poppins-Regular",
        backgroundColor: "#F0F0F0",
        color: COLORS.text,
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        marginBottom: 15,
    },
    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    modalButton: {
        borderRadius: 10,
        paddingVertical: 15,
        flex: 0.48,
        alignItems: "center",
        justifyContent: "center",
    },
    modalButtonPrimary: {
        backgroundColor: COLORS.primary,
    },
    modalButtonSecondary: {
        backgroundColor: "#E0E0E0",
    },
    modalButtonText: {
        fontSize: 16,
        fontFamily: "Poppins-Medium",
        textAlign: "center",
    },
    modalButtonTextPrimary: {
        color: COLORS.white,
    },
    modalButtonTextSecondary: {
        color: COLORS.text,
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonTextDisabled: {
        color: COLORS.gray,
    },
    addAccountButton: {
        alignItems: "center",
        paddingVertical: 20,
    },
    addAccountCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "transparent",
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.text,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    addAccountText: {
        fontSize: 18,
        color: COLORS.text,
        fontFamily: "Poppins-SemiBold",
        marginBottom: 8,
    },
    addAccountSubText: {
        fontSize: 14,
        color: COLORS.gray,
        fontFamily: "Poppins-Regular",
        textAlign: "center",
        paddingHorizontal: 40,
    },
});
