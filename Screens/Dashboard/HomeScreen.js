import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image, Dimensions } from "react-native";
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

    const spendingCategories = [
        {
            id: 1,
            category: 'Food',
            amount: '$3,578.28',
            balance: '$750.20',
            icon: 'pizza-outline',
            backgroundColor: '#2D8F78'
        },
        {
            id: 2,
            category: 'Groceries',
            amount: '$3,578.28',
            balance: '$750.20',
            icon: 'basket-outline',
            backgroundColor: '#E1B345'
        },
        {
            id: 3,
            category: 'Entertainment',
            amount: '$3,578.28',
            balance: '$750.20',
            icon: 'musical-notes-outline',
            backgroundColor: '#007AFF'
        },
        {
            id: 4,
            category: 'Shopping',
            amount: '$3,578.28',
            balance: '$750.20',
            icon: 'cart-outline',
            backgroundColor: '#FF3B30'
        }
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

    const renderMainCards = () => (
        <View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScrollView}
                contentContainerStyle={styles.horizontalScrollContent}
                onScroll={handleMainScroll}
                scrollEventThrottle={16}
                snapToInterval={CARD_DIMENSIONS.mainCard.totalWidth}
                decelerationRate="fast"
                snapToAlignment="start"
                pagingEnabled={true}
            >
                <MainCard
                    title="Available Balance"
                    amount="$3,578"
                    amountColor="white"
                    description="See details"
                    backgroundColor="#012249"
                    Frame={require("../../assets/card-animation1.png")}
                />
                <MainCard
                    title="Total Income"
                    amount="$3,578.00"
                    amountColor="lightgreen"
                    backgroundColor="#2F2F42"
                    Frame={require("../../assets/guy-animation.png")}
                    extraField={[
                        { label: "Total Expenses", value: "$3,578.00", color: "#FF7C7C" },
                    ]}
                />
                <MainCard
                    title="Total Saving"
                    amount="$0.00"
                    amountColor="white"
                    description="See details"
                    backgroundColor="#AF7700"
                    Frame={require("../../assets/money-animation.png")}
                />
            </ScrollView>
            {renderPaginationDots(mainCardIndex, 3, { marginTop: 10 })}
        </View>
    );

    const renderFriendsSection = () => (
        <>
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>View your friends</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.friendsScrollView}
                contentContainerStyle={styles.friendsContainer}
            >
                {friends.map((friend) => (
                    <TouchableOpacity
                        key={friend.id}
                        style={styles.friendCircle}
                        onPress={() => handleFriendPress(friend)}
                    >
                        <View style={styles.friendAvatarContainer}>
                            <Ionicons
                                name="person-circle-outline"
                                size={50}
                                color={COLORS.text}
                            />
                        </View>
                        <Text style={styles.friendName}>{friend.name}</Text>
                    </TouchableOpacity>
                ))}
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
            </ScrollView>
        </>
    );

    const renderSubCards = () => (
        <View>
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Spending Categories</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScrollView}
                contentContainerStyle={styles.horizontalScrollContent}
                onScroll={handleSubScroll}
                scrollEventThrottle={16}
                snapToInterval={CARD_DIMENSIONS.subCard.totalWidth}
                decelerationRate="fast"
                snapToAlignment="start"
                pagingEnabled={true}
            >
                <SubCard
                    Category="Food"
                    amount="$3,578.28"
                    description="Available balance $750.20"
                    backgroundColor="#2D8F78"
                    iconName="pizza-outline"
                    rotation="40deg"
                />
                <SubCard
                    Category="Groceries"
                    amount="$3,578.28"
                    description="Available balance $750.20"
                    backgroundColor="#E1B345"
                    iconName="basket-outline"
                />
                <SubCard
                    Category="Shopping"
                    amount="$3,578.28"
                    description="Available balance $750.20"
                    backgroundColor="#0D60C4"
                    iconName="bag-outline"
                />
                <SubCard
                    Category="Travel and vacation"
                    amount="$3,578.28"
                    description="Available balance $750.20"
                    backgroundColor="#0B2749"
                    iconName="airplane-outline"
                    rotation="-40deg"
                />
                <SubCard
                    Category="Bank Fees"
                    amount="$3,578.28"
                    description="Available balance $750.20"
                    backgroundColor="#1C4A3E"
                    iconName="business-outline"
                />
            </ScrollView>
            {renderPaginationDots(subCardIndex, 5, { marginTop: 10 })}
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
            <View style={styles.transactionGroup}>
                <Text style={styles.transactionDate}>Today</Text>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={styles.transactionIcon}>
                            <Ionicons name="logo-apple" size={24} color="black" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>Apple Store</Text>
                            <Text style={styles.transactionCategory}>Entertainment</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $5.99</Text>
                </View>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#E1B345' }]}>
                            <Ionicons name="basket-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>Walmart</Text>
                            <Text style={styles.transactionCategory}>Groceries</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $45.32</Text>
                </View>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#2D8F78' }]}>
                            <Ionicons name="pizza-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>Pizza Hut</Text>
                            <Text style={styles.transactionCategory}>Food</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $28.50</Text>
                </View>
            </View>
            <View style={styles.transactionGroup}>
                <Text style={styles.transactionDate}>Yesterday</Text>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#007AFF' }]}>
                            <Ionicons name="musical-notes-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>Spotify</Text>
                            <Text style={styles.transactionCategory}>Entertainment</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $9.99</Text>
                </View>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#FF3B30' }]}>
                            <Ionicons name="cart-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>Amazon</Text>
                            <Text style={styles.transactionCategory}>Shopping</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $89.99</Text>
                </View>
            </View>
            <View style={styles.transactionGroup}>
                <Text style={styles.transactionDate}>Last 7 Days</Text>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#0B2749' }]}>
                            <Ionicons name="airplane-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>United Airlines</Text>
                            <Text style={styles.transactionCategory}>Travel</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $299.00</Text>
                </View>
                <View style={styles.transaction}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: '#1C4A3E' }]}>
                            <Ionicons name="business-outline" size={24} color="white" />
                        </View>
                        <View>
                            <Text style={styles.transactionName}>Bank Fee</Text>
                            <Text style={styles.transactionCategory}>Fees</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>- $35.00</Text>
                </View>
            </View>
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
    horizontalScrollView: {
        flexDirection: "row",
    },
    horizontalScrollContent: {
        paddingHorizontal: 20,
        paddingRight: 10, // Ensure consistent padding on both sides
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
    friendsScrollView: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    friendsContainer: {
        paddingHorizontal: 20,
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
        color: '#007AFF',
        fontSize: 14,
    },
    transactionGroup: {
        marginBottom: 16,
    },
    transactionDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
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
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    transactionCategory: {
        fontSize: 12,
        color: '#666',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
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
