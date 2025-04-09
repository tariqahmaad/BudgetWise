import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator, TextInput } from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS, CATEGORY_ICONS } from "../../constants/theme";
import MainCard from "../../Components/CategoryCards/MainCard";
import SubCard from "../../Components/CategoryCards/SubCard";
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from "../../Components/ScreenWrapper";
import { auth, firestore, collection, onSnapshot, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs } from "../../firebase/firebaseConfig";
import Images from "../../constants/Images";

// Create the map dynamically from the imported constant
const CATEGORY_ICON_MAP = CATEGORY_ICONS.reduce((map, category) => {
    map[category.label] = category.name;
    return map;
}, {});

// Constants for card dimensions and spacing
const CARD_DIMENSIONS = {
    mainCard: {
        width: 370,
        margin: 13,
        totalWidth: 370 + 13
    },
    subCard: {
        width: 295,
        margin: 15,
        totalWidth: 295 + 15
    }
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
    const [categoriesData, setCategoriesData] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [rawCategories, setRawCategories] = useState([]);
    const [userData, setUserData] = useState({
        name: '',
        surname: '',
        avatar: Images.profilePic
    });

    const [transactions, setTransactions] = useState([]);

    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [newFriendName, setNewFriendName] = useState("");
    const [newFriendEmail, setNewFriendEmail] = useState("");

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const transactionsRef = collection(firestore, "users", user.uid, "transactions");
        const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
            const txns = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTransactions(txns);
        }, (error) => {
            console.error("Error fetching transactions:", error);
        });

        return unsubscribe;
    }, []);

    const { width } = Dimensions.get('window');

    // Fetch accounts
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setAccountsLoading(false);
            return;
        }
        setAccountsLoading(true);
        const accountsRef = collection(firestore, "users", user.uid, "accounts");
        const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
            const accounts = snapshot.docs.map(doc => {
                const data = doc.data();
                // Common account data regardless of type
                const accountData = {
                    id: doc.id,
                    title: data.title,
                    backgroundColor: data.backgroundColor || "#012249",
                    type: data.type,
                    description: "See details"
                };

                // Different account types have different display formats
                switch (data.type) {
                    case 'balance':
                        return {
                            ...accountData,
                            amount: `$${(data.currentBalance ?? 0).toFixed(2)}`,
                            amountColor: data.amountColor || "white",
                            Frame: require("../../assets/card-animation1.png"),
                            extraField: []
                        };
                    case 'income_tracker':
                        return {
                            ...accountData,
                            amount: `$${(data.currentBalance ?? 0).toFixed(2)}`,
                            amountColor: data.amountColor || "lightgreen",
                            Frame: require("../../assets/guy-animation.png"),
                            extraField: [
                                { label: "Total Income", value: `$${(data.totalIncome ?? 0).toFixed(2)}`, color: "lightgreen" },
                                { label: "Total Expenses", value: `$${(data.totalExpenses ?? 0).toFixed(2)}`, color: "#FF7C7C" }
                            ]
                        };
                    case 'savings_goal':
                        const progress = data.savingGoalTarget > 0
                            ? Math.min(100, ((data.currentBalance ?? 0) / data.savingGoalTarget) * 100)
                            : 0;
                        return {
                            ...accountData,
                            amount: `$${(data.currentBalance ?? 0).toFixed(2)}`,
                            amountColor: data.amountColor || "white",
                            Frame: require("../../assets/money-animation.png"),
                            extraField: [
                                { label: "Goal", value: `$${(data.savingGoalTarget ?? 0).toFixed(2)}`, color: "#FDB347" },
                                { label: "Progress", value: `${progress.toFixed(0)}%`, color: progress >= 100 ? "lightgreen" : "#FDB347" }
                            ]
                        };
                    default:
                        return {
                            ...accountData,
                            amount: `$${(data.currentBalance ?? 0).toFixed(2)}`,
                            amountColor: "white",
                            Frame: require("../../assets/card-animation1.png"),
                            extraField: []
                        };
                }
            });
            setMainCardsData(accounts);
            setAccountsLoading(false);
        }, (error) => {
            console.error("Error fetching accounts: ", error);
            setAccountsLoading(false);
        });
        return unsubscribe;
    }, []);

    // Fetch raw categories (without transaction logic)
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setCategoriesLoading(false);
            return;
        }
        setCategoriesLoading(true);
        const categoriesRef = collection(firestore, "users", user.uid, "categories");
        const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
            try {
                const fetchedCategories = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        Category: data.name,
                        backgroundColor: data.backgroundColor || COLORS.primary, // Use a default
                        iconName: data.iconName || 'help-circle-outline',
                        name: data.name,
                    };
                });
                setRawCategories(fetchedCategories);
                setCategoriesLoading(false);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setCategoriesLoading(false);
            }
        }, (error) => {
            console.error("Error subscribing to categories:", error);
            setCategoriesLoading(false);
        });

        return unsubscribe;
    }, []);

    // Memoize category data calculation based on raw categories and transactions
    const processedCategoriesData = useMemo(() => {
        // Create a map to track category totals and latest transactions
        const categoryTotals = {};
        const categoryLatestDesc = {};
        const categoryTransactionCounts = {};

        // Filter expense transactions
        const expenseTransactions = transactions.filter(t => t.type === 'Expenses');

        // Calculate totals for each category using the transactions state
        expenseTransactions.forEach(transaction => {
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
        return rawCategories.map(cat => {
            const total = categoryTotals[cat.Category] || 0;
            const count = categoryTransactionCounts[cat.Category] || 0;
            const desc = categoryLatestDesc[cat.Category];
            let amountStr = "$0.00";
            let descriptionStr = "No spending yet";

            if (total > 0) {
                amountStr = `$${total.toFixed(2)}`;
                descriptionStr = count > 1
                    ? `${count} expenses`
                    : (desc || "1 expense");
            }

            return {
                ...cat,
                amount: amountStr,
                description: descriptionStr,
            };
        });
    }, [rawCategories, transactions]);

    // Memoize sorted transactions
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0); // Handle undefined dates
            const dateB = b.date ? new Date(b.date) : new Date(0); // Handle undefined dates
            return dateB - dateA;
        });
    }, [transactions]);

    // Fetch user data
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const fetchUserData = async () => {
            try {
                const userDoc = await getDoc(doc(firestore, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData({
                        name: data.name || '',
                        surname: data.surname || '',
                        avatar: data.avatar ? { uri: data.avatar } : Images.profilePic
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUserData();
    }, []);

    // Memoized handlers
    const handleMainScroll = useCallback((event) => {
        if (accountsLoading || mainCardsData.length === 0) return;
        const index = Math.round(event.nativeEvent.contentOffset.x / CARD_DIMENSIONS.mainCard.totalWidth);
        setMainCardIndex(Math.min(Math.max(index, 0), mainCardsData.length - 1));
    }, [accountsLoading, mainCardsData.length]);

    const handleSubScroll = useCallback((event) => {
        if (categoriesLoading || processedCategoriesData.length === 0) return;
        const index = Math.round(event.nativeEvent.contentOffset.x / CARD_DIMENSIONS.subCard.totalWidth);
        setSubCardIndex(Math.min(Math.max(index, 0), processedCategoriesData.length - 1));
    }, [categoriesLoading, processedCategoriesData.length]);

    const handleFriendPress = useCallback((friend) => {
        navigation.navigate('addDebt', { friend });
    }, [navigation]);

    // Memoize renderItem for MainCards
    const renderMainCardItem = useCallback(({ item, index }) => (
        <MainCard
            {...item}
            isLast={index === mainCardsData.length - 1}
        />
    ), [mainCardsData.length]);

    // Memoize renderItem for FriendsList
    const renderFriendItem = useCallback(({ item }) => (
        <TouchableOpacity style={styles.friendCircle} onPress={() => handleFriendPress(item)}>
            <View style={styles.friendAvatarContainer}>
                <Ionicons name="person-circle-outline" size={50} color={COLORS.text} />
            </View>
            <Text style={styles.friendName}>{item.name}</Text>
        </TouchableOpacity>
    ), [handleFriendPress]);

    const [friends, setFriends] = useState([]);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const friendsRef = collection(firestore, "users", user.uid, "friends");
        const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
            const fetchedFriends = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setFriends(fetchedFriends);
        }, (error) => {
            console.error("Error fetching friends: ", error);
        });

        return unsubscribe;
    }, []);

    const renderPaginationDots = useCallback((currentIndex, total, style) => (
        <View style={[styles.paginationDots, style]}>
            {Array.from({ length: total }).map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.dot,
                        index === currentIndex ? styles.activeDot : styles.inactiveDot
                    ]}
                />
            ))}
        </View>
    ), []);

    // Memoize main rendering functions
    const renderMainCards = useCallback(() => {
        if (accountsLoading) {
            return <ActivityIndicator size="large" color={COLORS.primary} style={styles.cardContainerHeight} />;
        }
        if (mainCardsData.length === 0) {
            return (
                <View style={[styles.cardContainerHeight, styles.emptyState]}>
                    <Ionicons name="wallet-outline" size={50} color={COLORS.gray} />
                    <Text style={styles.emptyText}>No Accounts Yet</Text>
                    <Text style={styles.emptySubText}>Add your bank accounts or income trackers in Settings.</Text>
                </View>
            );
        }
        return (
            <>
                <FlatList
                    data={mainCardsData}
                    renderItem={renderMainCardItem}
                    keyExtractor={item => String(item.id)}
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
                {mainCardsData.length > 1 && renderPaginationDots(mainCardIndex, mainCardsData.length, { marginTop: 10 })}
            </>
        );
    }, [accountsLoading, mainCardsData, mainCardIndex, renderMainCardItem, renderPaginationDots]);

    const renderFriendsSection = useCallback(() => (
        <>
            <SectionHeader title="View your friends" onPress={() => { /* TODO: Navigate to Friends List */ }} />
            <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={item => String(item.id)}
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
    ), [friends, renderFriendItem, handleFriendPress, showAddFriendModal, setShowAddFriendModal]);

    const renderSubCards = useCallback(() => {
        if (categoriesLoading) {
            return <ActivityIndicator size="large" color={COLORS.primary} style={styles.cardContainerHeight} />;
        }
        if (processedCategoriesData.length === 0) {
            return (
                <View style={styles.section}>
                    <SectionHeader title="Spending Categories" />
                    <View style={[styles.cardContainerHeight, styles.emptyState]}>
                        <Ionicons name="layers-outline" size={50} color={COLORS.gray} />
                        <Text style={styles.emptyText}>No Categories Yet</Text>
                        <Text style={styles.emptySubText}>Add spending categories in Settings to track your budget.</Text>
                    </View>
                </View>
            );
        }
        return (
            <>
                <SectionHeader title="Spending Categories" onPress={() => { /* TODO: Navigate to Categories List */ }} />
                <FlatList
                    data={processedCategoriesData}
                    renderItem={renderSubCardItem}
                    keyExtractor={item => String(item.id)}
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
                {processedCategoriesData.length > 1 && renderPaginationDots(subCardIndex, processedCategoriesData.length, { marginTop: 10 })}
            </>
        );
    }, [categoriesLoading, processedCategoriesData, subCardIndex, renderSubCardItem, renderPaginationDots, handleSubScroll]);

    // Memoize the renderItem for SubCards
    const renderSubCardItem = useCallback(({ item, index }) => (
        <SubCard
            {...item}
            isLast={index === processedCategoriesData.length - 1}
        />
    ), [processedCategoriesData.length]);

    const renderTransactionHistory = useCallback(() => {
        return (
            <View style={styles.section}>
                <SectionHeader title="Transaction History" onPress={() => { /* TODO: Navigate to Transactions List */ }} />
                <FlatList
                    data={sortedTransactions}
                    renderItem={renderTransactionItem}
                    keyExtractor={item => String(item.id)}
                    scrollEnabled={false}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                    initialNumToRender={5}
                    maxToRenderPerBatch={10}
                    windowSize={11}
                />
            </View>
        );
    }, [sortedTransactions, renderTransactionItem]);

    // Memoize the renderItem for Transactions
    const renderTransactionItem = useCallback(({ item }) => (
        <View style={styles.transaction}>
            <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: '#E1B345' }]}>
                    <Ionicons
                        name={CATEGORY_ICON_MAP[item.category] || 'cash-outline'}
                        size={30}
                        color={COLORS.text}
                    />
                </View>
                <View>
                    <Text style={styles.transactionName}>{item.description || 'No Description'}</Text>
                    <Text style={styles.transactionCategory}>{item.category || 'Uncategorized'}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                        {item.date ? new Date(item.date).toLocaleString() : ''}
                    </Text>
                </View>
            </View>
            <Text style={[
                styles.transactionAmount,
                { color: item.type === 'Income' ? 'green' : '#FF3B30' }
            ]}>
                {item.amount ? `$${parseFloat(item.amount).toFixed(2)}` : '$0.00'}
            </Text>
        </View>
    ), []);

    const handleAddFriend = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user || !newFriendName.trim()) return;
            await addDoc(collection(firestore, "users", user.uid, "friends"), {
                name: newFriendName.trim(),
                email: newFriendEmail.trim(),
                createdAt: serverTimestamp(),
            });
            setNewFriendName("");
            setNewFriendEmail("");
            setShowAddFriendModal(false);
        } catch (error) {
            console.error("Error adding friend:", error);
        }
    }, [newFriendName, newFriendEmail]);

    const handleCancelAddFriend = useCallback(() => {
        setShowAddFriendModal(false);
    }, []);

    return (
        <ScreenWrapper backgroundColor={COLORS.appBackground}>
            <View style={styles.container}>
                {/* User Profile */}
                <View style={styles.profileSection}>
                    <View style={styles.profileContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                            {userData.avatar ? (
                                <Image source={userData.avatar} style={[styles.profileImage, { borderRadius: 20 }]} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={40} color={COLORS.text} style={styles.profileImage} />
                            )}
                        </TouchableOpacity>
                        <View style={styles.welcomeTextContainer}>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.userName}>
                                {userData.name && userData.surname ? `${userData.name} ${userData.surname}` : 'User'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notificationContainer}>
                        <Ionicons name="notifications-outline" size={34} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false} nestedScrollEnabled>
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
                            <TouchableOpacity style={styles.modalButton} onPress={handleAddFriend}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handleCancelAddFriend}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        alignItems: 'flex-start',
    },
    friendCircle: {
        alignItems: 'center',
        marginRight: 16,
    },
    friendAvatarContainer: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    friendName: {
        fontSize: 13,
        color: COLORS.text,
        fontFamily: "Poppins-Medium",
    },
    addFriendButton: {
        alignItems: 'center',
        marginRight: 20,
    },
    addFriendCircle: {
        width: 65,
        height: 65,
        borderRadius: 32.5,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: COLORS.text,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        color: '#666',
        marginBottom: 12,
        fontFamily: "Poppins-Medium",
    },
    transaction: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionName: {
        fontSize: 16,
        color: '#000',
        fontFamily: "Poppins-Medium",
    },
    transactionCategory: {
        fontSize: 12,
        color: '#666',
        fontFamily: "Poppins-Regular",
    },
    transactionAmount: {
        fontSize: 16,
        fontFamily: "Poppins-SemiBold",
    },
    bottomPadding: {
        height: 80,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
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
        justifyContent: 'center',
        alignItems: 'center',
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
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.gray,
        fontFamily: "Poppins-Regular",
        textAlign: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: "Poppins-SemiBold",
        marginBottom: 20,
    },
    modalInput: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 10,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        padding: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 5,
        flex: 1,
        marginRight: 5,
    },
    modalButtonText: {
        fontSize: 16,
        fontFamily: "Poppins-Medium",
        color: 'white',
        textAlign: 'center',
    },
});
