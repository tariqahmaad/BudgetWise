import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Dimensions, FlatList } from "react-native";
import React, { useState } from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import MainCard from "../../Components/CategoryCards/MainCard";
import SubCard from "../../Components/CategoryCards/SubCard";
import { Ionicons } from '@expo/vector-icons';

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

// Define data arrays for FlatLists
const mainCardsData = [
    {
        id: 'balance',
        title: "Available Balance",
        amount: "$3,578",
        amountColor: "white",
        description: "See details",
        backgroundColor: "#012249",
        Frame: require("../../assets/card-animation1.png"),
    },
    {
        id: 'income',
        title: "Total Income",
        amount: "$3,578.00",
        amountColor: "lightgreen",
        backgroundColor: "#2F2F42",
        Frame: require("../../assets/guy-animation.png"),
        extraField: [
            { label: "Total Expenses", value: "$3,578.00", color: "#FF7C7C" },
        ],
    },
    {
        id: 'saving',
        title: "Total Saving",
        amount: "$0.00",
        amountColor: "white",
        description: "See details",
        backgroundColor: "#AF7700",
        Frame: require("../../assets/money-animation.png"),
    }
];

const subCardsData = [
    {
        id: 'food',
        Category: "Food",
        amount: "$3,578.28",
        description: "Available balance $750.20",
        backgroundColor: "#2D8F78",
        iconName: "pizza-outline",
        rotation: "40deg"
    },
    {
        id: 'groceries',
        Category: "Groceries",
        amount: "$3,578.28",
        description: "Available balance $750.20",
        backgroundColor: "#E1B345",
        iconName: "basket-outline"
    },
    {
        id: 'shopping',
        Category: "Shopping",
        amount: "$3,578.28",
        description: "Available balance $750.20",
        backgroundColor: "#0D60C4",
        iconName: "bag-outline"
    },
    {
        id: 'travel',
        Category: "Travel and vacation",
        amount: "$3,578.28",
        description: "Available balance $750.20",
        backgroundColor: "#0B2749",
        iconName: "airplane-outline",
        rotation: "-40deg"
    },
    {
        id: 'fees',
        Category: "Bank Fees",
        amount: "$3,578.28",
        description: "Available balance $750.20",
        backgroundColor: "#1C4A3E",
        iconName: "business-outline"
    }
];

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

const HomeScreen = () => {
    // State management for card pagination
    const [mainCardIndex, setMainCardIndex] = useState(0);
    const [subCardIndex, setSubCardIndex] = useState(0);
    const { width } = Dimensions.get('window');

    // Sample data
    const friends = [
        { id: 1, name: 'Name' },
        { id: 2, name: 'Name' },
        { id: 3, name: 'Name' },
        { id: 4, name: 'Name' },
        { id: 5, name: 'Name' },
    ];

    // Event handlers
    const handleFriendPress = (friend) => {
        console.log(`Navigating to debt tracking with ${friend.name}`);
        // Navigation logic would go here
    };

    const handleMainScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / CARD_DIMENSIONS.mainCard.totalWidth);
        setMainCardIndex(index);
    };

    const handleSubScroll = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / CARD_DIMENSIONS.subCard.totalWidth);
        setSubCardIndex(index);
    };

    // UI Components
    const renderPaginationDots = (currentIndex, total, style) => {
        return (
            <View style={[styles.paginationDots, style]}>
                {Array(total).fill(0).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === currentIndex ? styles.activeDot : styles.inactiveDot
                        ]}
                    />
                ))}
            </View>
        );
    };

    // Render Main Cards using FlatList
    const renderMainCardItem = ({ item }) => (
        <MainCard
            title={item.title}
            amount={item.amount}
            amountColor={item.amountColor}
            description={item.description}
            backgroundColor={item.backgroundColor}
            Frame={item.Frame}
            extraField={item.extraField}
        />
    );

    const renderMainCards = () => (
        <View>
            <FlatList
                data={mainCardsData}
                renderItem={renderMainCardItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flatListContentContainer}
                onScroll={handleMainScroll}
                scrollEventThrottle={16}
                snapToInterval={CARD_DIMENSIONS.mainCard.totalWidth}
                decelerationRate="fast"
                snapToAlignment="start"
                pagingEnabled
            />
            {renderPaginationDots(mainCardIndex, mainCardsData.length, { marginTop: 10 })}
        </View>
    );

    // Render Friends using FlatList
    const renderFriendItem = ({ item }) => (
        <TouchableOpacity
            key={item.id}
            style={styles.friendCircle}
            onPress={() => handleFriendPress(item)}
        >
            <View style={styles.friendAvatarContainer}>
                <Ionicons
                    name="person-circle-outline"
                    size={50}
                    color={COLORS.text}
                />
            </View>
            <Text style={styles.friendName}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderAddFriendButton = () => (
        <TouchableOpacity style={styles.addFriendButton}>
            <View style={styles.addFriendCircle}>
                <Ionicons
                    name="add"
                    size={32}
                    color={COLORS.text}
                />
            </View>
            <Text style={styles.friendName}>Add new</Text>
        </TouchableOpacity>
    );

    const renderFriendsSection = () => (
        <>
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>View your friends</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsFlatListContainer}
                ListFooterComponent={renderAddFriendButton}
            />
        </>
    );

    // Render Sub Cards (Spending Categories) using FlatList
    const renderSubCardItem = ({ item }) => (
        <SubCard
            Category={item.Category}
            amount={item.amount}
            description={item.description}
            backgroundColor={item.backgroundColor}
            iconName={item.iconName}
            rotation={item.rotation}
        />
    );

    const renderSubCards = () => (
        <View>
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Spending Categories</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={subCardsData}
                renderItem={renderSubCardItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flatListContentContainer}
                onScroll={handleSubScroll}
                scrollEventThrottle={16}
                snapToInterval={CARD_DIMENSIONS.subCard.totalWidth}
                decelerationRate="fast"
                snapToAlignment="start"
                pagingEnabled
            />
            {renderPaginationDots(subCardIndex, subCardsData.length, { marginTop: 10 })}
        </View>
    );

    // Render a single transaction item
    const renderTransactionItem = ({ item }) => (
        <View style={styles.transaction}>
            <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={24} color={item.iconColor || 'white'} />
                </View>
                <View>
                    <Text style={styles.transactionName}>{item.name}</Text>
                    <Text style={styles.transactionCategory}>{item.category}</Text>
                </View>
            </View>
            <Text style={[styles.transactionAmount, { color: item.amount.startsWith('+') ? 'green' : '#FF3B30' }]}>{item.amount}</Text> {/* Dynamic color based on +/- */}
        </View>
    );

    // Render a group of transactions (e.g., "Today", "Yesterday")
    const renderTransactionGroup = ({ item }) => (
        <View style={styles.transactionGroup}>
            <Text style={styles.transactionDate}>{item.title}</Text>
            <FlatList
                data={item.data}
                renderItem={renderTransactionItem}
                keyExtractor={transaction => transaction.id}
                scrollEnabled={false} // Disable scrolling for inner list
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />} // Add space between items
            />
        </View>
    );

    const renderTransactionHistory = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllButton}>See All</Text>
                </TouchableOpacity>
            </View>
            {/* Use FlatList to render transaction groups */}
            <FlatList
                data={transactionData}
                renderItem={renderTransactionGroup}
                keyExtractor={group => group.title}
                scrollEnabled={false} // Disable scrolling for outer list if main ScrollView handles it
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* User Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileContainer}>
                        <Ionicons
                            name="person-circle-outline"
                            size={40}
                            color={COLORS.text}
                            style={styles.profileImage}
                        />
                        <View style={styles.welcomeTextContainer}>
                            <Text style={styles.welcomeText}>Welcome back,</Text>
                            <Text style={styles.userName}>Firstname Lastname</Text>
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

                {/* Main content with ScrollViews */}
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    {renderMainCards()}
                    {renderFriendsSection()}
                    {renderSubCards()}
                    {renderTransactionHistory()}
                    <View style={styles.bottomPadding} />
                </ScrollView>

                {/* Navigation Bar */}
                <NavigationBar />
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.appBackground,
        paddingTop: 35,
    },
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
        paddingHorizontal: 10,
    },
    sectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
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
        paddingHorizontal: 20,
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
});
