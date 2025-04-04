import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator } from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import MainCard from "../../Components/CategoryCards/MainCard";
import SubCard from "../../Components/CategoryCards/SubCard";
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from "../../Components/ScreenWrapper";
import { auth, firestore, collection, getDocs, onSnapshot, doc, getDoc } from "../../firebase/firebaseConfig";
import Images from "../../constants/Images";

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

// Define sample transaction data
const transactionData = [
    {
        title: "Today",
        data: [
            { id: 't1', name: 'Apple Store', category: 'Entertainment', amount: '- $5.99', icon: 'logo-apple', iconBg: '#F2F2F7', iconColor: 'black' },
            { id: 't2', name: 'Walmart', category: 'Groceries', amount: '- $45.32', icon: 'basket-outline', iconBg: '#E1B345', iconColor: 'white' },
            { id: 't3', name: 'Pizza Hut', category: 'Food', amount: '- $28.50', icon: 'pizza-outline', iconBg: '#2D8F78', iconColor: 'white' },
        ]
    },
    {
        title: "Yesterday",
        data: [
            { id: 't4', name: 'Spotify', category: 'Entertainment', amount: '- $9.99', icon: 'musical-notes-outline', iconBg: '#007AFF', iconColor: 'white' },
            { id: 't5', name: 'Amazon', category: 'Shopping', amount: '- $89.99', icon: 'cart-outline', iconBg: '#FF3B30', iconColor: 'white' },
        ]
    },
    {
        title: "Last 7 Days",
        data: [
            { id: 't6', name: 'United Airlines', category: 'Travel', amount: '- $299.00', icon: 'airplane-outline', iconBg: '#0B2749', iconColor: 'white' },
            { id: 't7', name: 'Bank Fee', category: 'Fees', amount: '- $35.00', icon: 'business-outline', iconBg: '#1C4A3E', iconColor: 'white' },
        ]
    },
];

const HomeScreen = ({ navigation }) => {
    const [mainCardIndex, setMainCardIndex] = useState(0);
    const [subCardIndex, setSubCardIndex] = useState(0);
    const [mainCardsData, setMainCardsData] = useState([]);
    const [categoriesData, setCategoriesData] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [userData, setUserData] = useState({
        name: '',
        surname: '',
        avatar: Images.profilePic
    });

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
                return {
                    id: doc.id,
                    title: data.title,
                    amount: `$${(data.currentBalance ?? 0).toFixed(2)}`,
                    amountColor: data.amountColor || "white",
                    description: "See details",
                    backgroundColor: data.backgroundColor || "#012249",
                    type: data.type,
                    Frame: data.type === 'balance' ? require("../../assets/card-animation1.png") :
                        data.type === 'income_tracker' ? require("../../assets/guy-animation.png") :
                            require("../../assets/money-animation.png"),
                    extraField: data.type === 'income_tracker' ? [
                        { label: "Total Income", value: `$${(data.totalIncome ?? 0).toFixed(2)}`, color: "lightgreen" },
                        { label: "Total Expenses", value: `$${(data.totalExpenses ?? 0).toFixed(2)}`, color: "#FF7C7C" }
                    ] : []
                };
            });
            setMainCardsData(accounts);
            setAccountsLoading(false);
        }, (error) => {
            console.error("Error fetching accounts: ", error);
            setAccountsLoading(false);
        });
        return unsubscribe;
    }, []);

    // Fetch categories
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setCategoriesLoading(false);
            return;
        }
        setCategoriesLoading(true);
        const categoriesRef = collection(firestore, "users", user.uid, "categories");
        const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
            const categories = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    Category: data.name,
                    amount: "$0.00",
                    description: "No spending yet",
                    backgroundColor: data.backgroundColor,
                    iconName: data.iconName,
                };
            });
            setCategoriesData(categories);
            setCategoriesLoading(false);
        }, (error) => {
            console.error("Error fetching categories: ", error);
            setCategoriesLoading(false);
        });
        return unsubscribe;
    }, []);

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
        if (categoriesLoading || categoriesData.length === 0) return;
        const index = Math.round(event.nativeEvent.contentOffset.x / CARD_DIMENSIONS.subCard.totalWidth);
        setSubCardIndex(Math.min(Math.max(index, 0), categoriesData.length - 1));
    }, [categoriesLoading, categoriesData.length]);

    const handleFriendPress = useCallback((friend) => {
        console.log("Navigation to debt tracking with", friend.name);
    }, []);

    const friends = useMemo(() => [
        { id: 1, name: 'Name' },
        { id: 2, name: 'Name' },
        { id: 3, name: 'Name' },
        { id: 4, name: 'Name' },
        { id: 5, name: 'Name' },
    ], []);

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

    const renderMainCards = () => {
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
                    renderItem={({ item }) => (
                        <MainCard {...item} />
                    )}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContentContainer}
                    onScroll={handleMainScroll}
                    scrollEventThrottle={16}
                    snapToInterval={CARD_DIMENSIONS.mainCard.totalWidth}
                    decelerationRate="fast"
                />
                {mainCardsData.length > 1 && renderPaginationDots(mainCardIndex, mainCardsData.length, { marginTop: 10 })}
            </>
        );
    };

    const renderFriendsSection = () => (
        <>
            <SectionHeader title="View your friends" onPress={() => console.log("See all friends")} />
            <FlatList
                data={friends}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.friendCircle} onPress={() => handleFriendPress(item)}>
                        <View style={styles.friendAvatarContainer}>
                            <Ionicons name="person-circle-outline" size={50} color={COLORS.text} />
                        </View>
                        <Text style={styles.friendName}>{item.name}</Text>
                    </TouchableOpacity>
                )}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsFlatListContainer}
                ListFooterComponent={() => (
                    <TouchableOpacity style={styles.addFriendButton}>
                        <View style={styles.addFriendCircle}>
                            <Ionicons name="add" size={32} color={COLORS.text} />
                        </View>
                        <Text style={styles.friendName}>Add new</Text>
                    </TouchableOpacity>
                )}
            />
        </>
    );

    const renderSubCards = () => {
        if (categoriesLoading) {
            return <ActivityIndicator size="large" color={COLORS.primary} style={styles.cardContainerHeight} />;
        }
        if (categoriesData.length === 0) {
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
                <SectionHeader title="Spending Categories" onPress={() => console.log("See all categories")} />
                <FlatList
                    data={categoriesData}
                    renderItem={({ item }) => (
                        <SubCard {...item} />
                    )}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContentContainer}
                    onScroll={handleSubScroll}
                    scrollEventThrottle={16}
                    snapToInterval={CARD_DIMENSIONS.subCard.totalWidth}
                    decelerationRate="fast"
                />
                {categoriesData.length > 1 && renderPaginationDots(subCardIndex, categoriesData.length, { marginTop: 10 })}
            </>
        );
    };

    const renderTransactionHistory = () => (
        <View style={styles.section}>
            <SectionHeader title="Transaction History" onPress={() => console.log("See all transactions")} />
            <FlatList
                data={transactionData}
                renderItem={({ item }) => (
                    <View style={styles.transactionGroup}>
                        <Text style={styles.transactionDate}>{item.title}</Text>
                        <FlatList
                            data={item.data}
                            renderItem={({ item: txn }) => (
                                <View style={styles.transaction}>
                                    <View style={styles.transactionLeft}>
                                        <View style={[styles.transactionIcon, { backgroundColor: txn.iconBg }]}>
                                            <Ionicons name={txn.icon} size={24} color={txn.iconColor || 'white'} />
                                        </View>
                                        <View>
                                            <Text style={styles.transactionName}>{txn.name}</Text>
                                            <Text style={styles.transactionCategory}>{txn.category}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.transactionAmount, { color: txn.amount.startsWith('+') ? 'green' : '#FF3B30' }]}>{txn.amount}</Text>
                                </View>
                            )}
                            keyExtractor={txn => txn.id}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        />
                    </View>
                )}
                keyExtractor={group => group.title}
                scrollEnabled={false}
            />
        </View>
    );

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
        marginRight: 24,
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
        padding: 16,
        borderRadius: 12,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    loadingContainer: {
    },
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
});
