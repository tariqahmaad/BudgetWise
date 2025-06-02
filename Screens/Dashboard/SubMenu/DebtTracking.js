//new code

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Animated,
  Easing,
} from "react-native";
import MainCard from "../../../Components/CategoryCards/MainCard";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import BackButton from "../../../Components/Buttons/BackButton";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import {
  COLORS,
  DEFAULT_CATEGORY_COLORS,
  SIZES,
} from "../../../constants/theme";
import { useAuth } from "../../../context/AuthProvider";
import {
  firestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "../../../firebase/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Dynamic modal sizing and spacing
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.92, 400);
const MODAL_PADDING_H = Math.round(SCREEN_WIDTH * 0.04);
const MODAL_PADDING_V = Math.round(SCREEN_HEIGHT * 0.025);
const FRIEND_CARD_GAP = Math.max(6, Math.round(SCREEN_HEIGHT * 0.008));
const MODAL_RADIUS = Math.round(SCREEN_WIDTH * 0.055);

// Constants for card dimensions and spacing (matching HomeScreen pattern)
const CARD_DIMENSIONS = {
  width: SCREEN_WIDTH * 0.9, // Match MainCard responsive width
  margin: SCREEN_WIDTH * 0.035, // Match MainCard responsive margin
  get totalWidth() { return this.width + this.margin; }
};

const DebtTracking = ({ navigation }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [debts, setDebts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state - Updated for friend actions
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  // Search state
  const [search, setSearch] = useState("");

  // Debt card pagination state
  const [debtCardIndex, setDebtCardIndex] = useState(0);
  const debtCardsRef = useRef(null);

  // Animation states for modal
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const backgroundOpacityAnim = useRef(new Animated.Value(0)).current;

  // Animation functions
  const openModal = useCallback((friend) => {
    setSelectedFriend(friend);
    setFriendModalVisible(true);

    // Reset animation values
    modalScaleAnim.setValue(0.8);
    modalOpacityAnim.setValue(0);
    backgroundOpacityAnim.setValue(0);

    // Start animations with smoother timing
    Animated.parallel([
      Animated.timing(backgroundOpacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth ease-out
      }),
      Animated.sequence([
        Animated.delay(50), // Small delay for better sequencing
        Animated.parallel([
          Animated.timing(modalOpacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          }),
          Animated.spring(modalScaleAnim, {
            toValue: 1,
            tension: 65,
            friction: 7,
            useNativeDriver: true,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          }),
        ]),
      ]),
    ]).start();
  }, [modalScaleAnim, modalOpacityAnim, backgroundOpacityAnim]);

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(backgroundOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // Smooth ease-in
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
      }),
      Animated.spring(modalScaleAnim, {
        toValue: 0.8,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      }),
    ]).start(() => {
      setFriendModalVisible(false);
      setSelectedFriend(null);
    });
  }, [modalScaleAnim, modalOpacityAnim, backgroundOpacityAnim]);

  // Function to toggle favorite status
  const toggleFavorite = useCallback(async (friend) => {
    if (!user || !friend) return;

    try {
      const friendRef = doc(firestore, "users", user.uid, "friends", friend.id);
      const newFavoriteStatus = !friend.isFavorite;

      await updateDoc(friendRef, {
        isFavorite: newFavoriteStatus,
      });

      // Update local state immediately for better UX
      setSelectedFriend(prev => prev ? { ...prev, isFavorite: newFavoriteStatus } : null);

    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert("Error", "Failed to update favorite status. Please try again.");
    }
  }, [user]);

  // Utility function to validate debt data
  const validateDebt = useCallback((debt) => {
    return debt &&
      typeof debt.amount === 'number' &&
      debt.amount > 0 &&
      ['Debt', 'Credit'].includes(debt.type);
  }, []);

  // Utility function to get valid unpaid debts
  const getValidUnpaidDebts = useCallback((friendDebts) => {
    return friendDebts.filter(debt => validateDebt(debt) && !debt.paid);
  }, [validateDebt]);

  // Utility function for debugging debt calculations
  const logDebtCalculations = useCallback((friends, debts) => {
    if (__DEV__) {
      console.log("=== Debt Calculation Debug ===");
      friends.forEach(friend => {
        const friendDebts = debts[friend.id] || [];
        const validDebts = getValidUnpaidDebts(friendDebts);
        const youOwe = validDebts.filter(d => d.type === "Debt");
        const theyOwe = validDebts.filter(d => d.type === "Credit");

        console.log(`Friend: ${friend.name}`);
        console.log(`  You owe: $${youOwe.reduce((sum, d) => sum + d.amount, 0)}`);
        console.log(`  They owe: $${theyOwe.reduce((sum, d) => sum + d.amount, 0)}`);
        console.log(`  Total debts: ${friendDebts.length}, Valid unpaid: ${validDebts.length}`);
      });
    }
  }, [getValidUnpaidDebts]);

  useEffect(() => {
    if (!user) return;
    const accountsRef = collection(firestore, "users", user.uid, "accounts");
    const unsub = onSnapshot(accountsRef, (snapshot) => {
      setAccounts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let friendsUnsub = null;
    let debtsUnsubs = [];

    setLoading(true);
    setError(null);

    const friendsRef = collection(firestore, "users", user.uid, "friends");
    friendsUnsub = onSnapshot(
      friendsRef,
      (friendsSnap) => {
        if (!isMounted) return;

        const fetchedFriends = friendsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriends(fetchedFriends);

        // Clean up previous debt listeners
        debtsUnsubs.forEach((unsub) => unsub());
        debtsUnsubs = [];

        if (fetchedFriends.length === 0) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        let completedListeners = 0;
        const totalListeners = fetchedFriends.length;

        fetchedFriends.forEach((friend) => {
          const debtsRef = collection(
            firestore,
            "users",
            user.uid,
            "friends",
            friend.id,
            "debts"
          );
          const unsub = onSnapshot(
            debtsRef,
            (debtsSnap) => {
              if (!isMounted) return;

              const allDebts = debtsSnap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }));

              // Store all debts (both paid and unpaid) for better data consistency
              setDebts((prev) => ({
                ...prev,
                [friend.id]: allDebts,
              }));

              completedListeners++;
              if (completedListeners === totalListeners && isMounted) {
                setLoading(false);
              }
            },
            (error) => {
              console.error(`Error fetching debts for friend ${friend.id}:`, error);
              if (isMounted) {
                setError("Failed to load some debt information. Please check your connection.");
                completedListeners++;
                if (completedListeners === totalListeners) {
                  setLoading(false);
                }
              }
            }
          );
          debtsUnsubs.push(unsub);
        });

        setError(null);
      },
      (error) => {
        console.error("Error fetching friends:", error);
        if (isMounted) {
          setError("Failed to load friends. Please check your connection.");
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      if (friendsUnsub) friendsUnsub();
      debtsUnsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  const { totalYouOwe, totalOwedToYou, oweList, owedList } = useMemo(() => {
    let totalYouOwe = 0;
    let totalOwedToYou = 0;
    let oweList = [];
    let owedList = [];

    friends.forEach((friend) => {
      const friendDebts = debts[friend.id] || [];
      const validDebts = getValidUnpaidDebts(friendDebts);

      // Sum all unpaid debts where you owe them
      const youOweAmount = validDebts
        .filter((d) => d.type === "Debt")
        .reduce((sum, d) => sum + d.amount, 0);

      // Sum all unpaid debts where they owe you
      const theyOweAmount = validDebts
        .filter((d) => d.type === "Credit")
        .reduce((sum, d) => sum + d.amount, 0);

      if (youOweAmount > 0) {
        totalYouOwe += youOweAmount;
        oweList.push({
          friend,
          amount: youOweAmount,
          debts: validDebts.filter((d) => d.type === "Debt"),
          youOweAmount,
          theyOweAmount,
        });
      }
      if (theyOweAmount > 0) {
        totalOwedToYou += theyOweAmount;
        owedList.push({
          friend,
          amount: theyOweAmount,
          debts: validDebts.filter((d) => d.type === "Credit"),
          youOweAmount,
          theyOweAmount,
        });
      }
    });

    return { totalYouOwe, totalOwedToYou, oweList, owedList };
  }, [debts, friends, getValidUnpaidDebts]);

  const handleBackPress = useCallback(() => {
    navigation.navigate("HomeScreen");
  }, [navigation]);

  const filteredFriends = useMemo(() =>
    friends.filter(
      (f) =>
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.email?.toLowerCase().includes(search.toLowerCase())
    ), [friends, search]);

  const debtCards = useMemo(() => [
    {
      key: "owe",
      title: "Total You Owe",
      amount: `$${totalYouOwe.toFixed(2)}`,
      amountColor: COLORS.LightRed,
      backgroundColor: COLORS.DeepRed,
      onPress: () => handleDebtCardPress("owe"),
    },
    {
      key: "owed",
      title: "Total Owed To You",
      amount: `$${totalOwedToYou.toFixed(2)}`,
      amountColor: COLORS.LightGreen,
      backgroundColor: COLORS.DeepGreen,
      onPress: () => handleDebtCardPress("owed"),
    },
  ], [totalYouOwe, totalOwedToYou, handleDebtCardPress]);

  // Debt Card render for FlatList (horizontal) - Updated to match HomeScreen pattern
  const renderDebtCard = useCallback(({ item, index }) => (
    <Pressable style={styles.debtCardPressable}>
      <MainCard
        title={item.title}
        amount={item.amount}
        description={item.description}
        amountColor={item.amountColor}
        backgroundColor={item.backgroundColor}
        Frame={require("../../../assets/debt-tracking-animation.png")}
        numberOfLines={1}
        ellipsizeMode="tail"
        isLast={index === debtCards.length - 1}
      />
    </Pressable>
  ), [debtCards.length]);

  // Pagination Dots
  const renderPaginationDots = useCallback((currentIndex, total) => (
    <View style={styles.paginationDots}>
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
  ), []);

  // Friend Card render for FlatList (vertical)
  const renderFriendItem = useCallback(({ item: friend }) => {
    const friendDebts = debts[friend.id] || [];
    const validDebts = getValidUnpaidDebts(friendDebts);

    const youOweAmount = validDebts
      .filter((d) => d.type === "Debt")
      .reduce((sum, d) => sum + d.amount, 0);

    const theyOweAmount = validDebts
      .filter((d) => d.type === "Credit")
      .reduce((sum, d) => sum + d.amount, 0);

    return (
      <View style={{ marginBottom: 12 }}>
        <FriendCard
          avatar={require("../../../assets/Avatar01.png")}
          name={friend.name}
          email={friend.email}
          isFavorite={friend.isFavorite}
          youOweAmount={youOweAmount}      // <-- must be a number
          theyOweAmount={theyOweAmount}    // <-- must be a number
          showAmounts={true}               // <-- must be true
          onPress={() => openModal(friend)}
        />
      </View>
    );
  }, [debts, getValidUnpaidDebts, openModal]);

  // Optimized scroll handler
  const handleScroll = useCallback((e) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / CARD_DIMENSIONS.totalWidth
    );
    setDebtCardIndex(index);
  }, []);

  const handleDebtCardPress = useCallback((type) => {
    // Navigate directly to debt management
    const targetList = type === "owe" ? oweList : owedList;

    if (targetList.length === 0) {
      // No debts to show - could show a message or do nothing
      Alert.alert(
        "No Debts",
        type === "owe"
          ? "You don't owe anyone money right now!"
          : "No one owes you money right now!"
      );
      return;
    }

    if (targetList.length === 1) {
      // Single friend - navigate directly to their debt details
      const item = targetList[0];
      navigation.navigate("DebtDetails", {
        friend: {
          avatar: require("../../../assets/Avatar01.png"),
          name: item.friend.name,
          email: item.friend.email || '',
          id: item.friend.id,
          isFavorite: item.friend.isFavorite || false,
        },
        debts: debts[item.friend.id] || [], // Pass all debts for this friend
        type: type,
      });
    } else {
      // Multiple friends - navigate to the first friend for now
      // TODO: Could implement a friend selection modal here
      const item = targetList[0];
      navigation.navigate("DebtDetails", {
        friend: {
          avatar: require("../../../assets/Avatar01.png"),
          name: item.friend.name,
          email: item.friend.email || '',
          id: item.friend.id,
          isFavorite: item.friend.isFavorite || false,
        },
        debts: debts[item.friend.id] || [], // Pass all debts for this friend
        type: type,
      });
    }
  }, [oweList, owedList, navigation, debts]);

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton onPress={handleBackPress} />
            <Text style={styles.title}>Debt Tracking</Text>
          </View>

          {/* Debt Cards as Horizontal Slider */}
          <FlatList
            ref={debtCardsRef}
            data={debtCards}
            keyExtractor={(item) => item.key}
            renderItem={renderDebtCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.flatListContentContainer}
            snapToInterval={CARD_DIMENSIONS.totalWidth}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={{ flexGrow: 0, width: SCREEN_WIDTH }}
          />

          {renderPaginationDots(debtCardIndex, debtCards.length)}

          <View style={styles.debtCardsBottomSpacer} />

          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search"
              placeholderTextColor="#BDBDBD"
              value={search}
              onChangeText={setSearch}
              underlineColorAndroid="transparent"
            />
          </View>

          {/* Friend List (vertical, scrollable only this part) */}
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.friendsFlatListContainer}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={{ textAlign: "center", color: "#666", marginTop: 24 }}>
                No friends found.
              </Text>
            }
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {loading && !error && (
            <ActivityIndicator
              style={{ marginTop: 32 }}
              size="large"
              color={COLORS.primary}
            />
          )}

          {/* Friend Action Modal */}
          <Modal visible={friendModalVisible} animationType="none" transparent>
            <TouchableWithoutFeedback onPress={closeModal}>
              <Animated.View
                style={{
                  flex: 1,
                  backgroundColor: backgroundOpacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)'],
                  }),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <TouchableWithoutFeedback onPress={() => { }}>
                  <Animated.View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: MODAL_RADIUS,
                      width: MODAL_WIDTH,
                      paddingHorizontal: MODAL_PADDING_H,
                      paddingTop: MODAL_PADDING_V + 10,
                      paddingBottom: MODAL_PADDING_V,
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOpacity: 0.08,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 8,
                      maxHeight: SCREEN_HEIGHT * 0.6,
                      transform: [
                        {
                          scale: modalScaleAnim.interpolate({
                            inputRange: [0, 0.8, 1],
                            outputRange: [0.7, 0.95, 1],
                            extrapolate: 'clamp',
                          }),
                        },
                        {
                          translateY: modalScaleAnim.interpolate({
                            inputRange: [0, 0.8, 1],
                            outputRange: [50, 10, 0],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                      opacity: modalOpacityAnim.interpolate({
                        inputRange: [0, 0.3, 1],
                        outputRange: [0, 0.8, 1],
                        extrapolate: 'clamp',
                      }),
                    }}
                  >
                    {selectedFriend && (
                      <>
                        <Animated.View
                          style={{
                            opacity: modalOpacityAnim.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0, 0.3, 1],
                              extrapolate: 'clamp',
                            }),
                            transform: [{
                              translateY: modalOpacityAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                                extrapolate: 'clamp',
                              }),
                            }],
                          }}
                        >
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: Math.round(SCREEN_HEIGHT * 0.015),
                          }}>
                            <Text
                              style={{
                                fontSize: Math.round(SCREEN_WIDTH * 0.05),
                                fontFamily: "Poppins-SemiBold",
                                textAlign: "center",
                                color: "#111",
                                marginRight: 8,
                              }}
                            >
                              {selectedFriend.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => toggleFavorite(selectedFriend)}
                              style={{
                                padding: 8,
                                borderRadius: 20,
                                backgroundColor: selectedFriend.isFavorite ? "#FFD700" : "#F0F0F0",
                              }}
                            >
                              <Ionicons
                                name={selectedFriend.isFavorite ? "star" : "star-outline"}
                                size={20}
                                color={selectedFriend.isFavorite ? "#FFF" : "#666"}
                              />
                            </TouchableOpacity>
                          </View>
                        </Animated.View>

                        {/* Friend Card Display */}
                        <Animated.View
                          style={{
                            marginBottom: Math.round(SCREEN_HEIGHT * 0.02),
                            width: "100%",
                            opacity: modalOpacityAnim.interpolate({
                              inputRange: [0, 0.6, 1],
                              outputRange: [0, 0.5, 1],
                              extrapolate: 'clamp',
                            }),
                            transform: [{
                              translateY: modalOpacityAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [15, 0],
                                extrapolate: 'clamp',
                              }),
                            }],
                          }}
                        >
                          <FriendCard
                            avatar={require("../../../assets/Avatar01.png")}
                            name={selectedFriend.name}
                            email={selectedFriend.email}
                            noShadow={true}
                            isFavorite={selectedFriend.isFavorite}
                            youOweAmount={(() => {
                              const friendDebts = debts[selectedFriend.id] || [];
                              const validDebts = getValidUnpaidDebts(friendDebts);
                              return validDebts.filter(d => d.type === "Debt").reduce((sum, d) => sum + d.amount, 0);
                            })()}
                            theyOweAmount={(() => {
                              const friendDebts = debts[selectedFriend.id] || [];
                              const validDebts = getValidUnpaidDebts(friendDebts);
                              return validDebts.filter(d => d.type === "Credit").reduce((sum, d) => sum + d.amount, 0);
                            })()}
                          />
                        </Animated.View>

                        {/* Action Buttons */}
                        <Animated.View
                          style={{
                            width: "100%",
                            gap: Math.round(SCREEN_HEIGHT * 0.015),
                            opacity: modalOpacityAnim.interpolate({
                              inputRange: [0, 0.7, 1],
                              outputRange: [0, 0.6, 1],
                              extrapolate: 'clamp',
                            }),
                            transform: [{
                              translateY: modalOpacityAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [10, 0],
                                extrapolate: 'clamp',
                              }),
                            }],
                          }}
                        >
                          {/* View Debt Details Button - Only show if there are outstanding debts */}
                          {(() => {
                            const friendDebts = debts[selectedFriend.id] || [];
                            const validDebts = getValidUnpaidDebts(friendDebts);
                            const youOweAmount = validDebts.filter(d => d.type === "Debt").reduce((sum, d) => sum + d.amount, 0);
                            const theyOweAmount = validDebts.filter(d => d.type === "Credit").reduce((sum, d) => sum + d.amount, 0);
                            const netAmount = youOweAmount - theyOweAmount;

                            // Only show button if there are outstanding debts (net amount > 0.01)
                            if (Math.abs(netAmount) > 0.01) {
                              return (
                                <TouchableOpacity
                                  onPress={() => {
                                    const primaryType = netAmount > 0 ? "owe" : "owed";

                                    navigation.navigate("DebtDetails", {
                                      friend: {
                                        avatar: require("../../../assets/Avatar01.png"),
                                        name: selectedFriend.name,
                                        email: selectedFriend.email || '',
                                        id: selectedFriend.id,
                                        isFavorite: selectedFriend.isFavorite || false,
                                      },
                                      debts: friendDebts, // Pass all debts for this friend
                                      type: primaryType,
                                    });
                                    closeModal();
                                  }}
                                  style={{
                                    backgroundColor: COLORS.primary,
                                    borderRadius: Math.round(SCREEN_WIDTH * 0.03),
                                    paddingVertical: Math.round(SCREEN_HEIGHT * 0.018),
                                    paddingHorizontal: Math.round(SCREEN_WIDTH * 0.06),
                                    alignItems: "center",
                                  }}
                                >
                                  <Text style={{
                                    color: "#fff",
                                    fontSize: Math.round(SCREEN_WIDTH * 0.045),
                                    fontFamily: "Poppins-SemiBold"
                                  }}>
                                    View Debt Details
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                            return null; // Don't render button if debts are settled
                          })()}

                          {/* Add New Debt Button */}
                          <TouchableOpacity
                            onPress={() => {
                              navigation.navigate("addDebt", {
                                friend: selectedFriend,
                                debts: getValidUnpaidDebts(debts[selectedFriend.id] || []),
                                type: "owe",
                              });
                              closeModal();
                            }}
                            style={{
                              backgroundColor: "#fff",
                              borderRadius: Math.round(SCREEN_WIDTH * 0.03),
                              paddingVertical: Math.round(SCREEN_HEIGHT * 0.018),
                              paddingHorizontal: Math.round(SCREEN_WIDTH * 0.06),
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: COLORS.primary,
                            }}
                          >
                            <Text style={{
                              color: COLORS.primary,
                              fontSize: Math.round(SCREEN_WIDTH * 0.045),
                              fontFamily: "Poppins-SemiBold"
                            }}>
                              Add New Debt
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>

                        {/* Close Button */}
                        <Animated.View
                          style={{
                            opacity: modalOpacityAnim.interpolate({
                              inputRange: [0, 0.8, 1],
                              outputRange: [0, 0.7, 1],
                              extrapolate: 'clamp',
                            }),
                            transform: [{
                              translateY: modalOpacityAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [5, 0],
                                extrapolate: 'clamp',
                              }),
                            }],
                          }}
                        >
                          <TouchableOpacity
                            onPress={closeModal}
                            style={{
                              marginTop: Math.round(SCREEN_HEIGHT * 0.02),
                              alignSelf: "center",
                              backgroundColor: "#fff",
                              borderRadius: Math.round(SCREEN_WIDTH * 0.03),
                              paddingHorizontal: Math.round(SCREEN_WIDTH * 0.08),
                              paddingVertical: Math.round(SCREEN_HEIGHT * 0.015),
                              borderWidth: 1,
                              borderColor: "#ddd",
                            }}
                          >
                            <Text style={{
                              color: "#111",
                              fontSize: Math.round(SCREEN_WIDTH * 0.04),
                              fontFamily: "Poppins-SemiBold"
                            }}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      </>
                    )}
                  </Animated.View>
                </TouchableWithoutFeedback>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  flatListContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  debtCardsFlatListContainer: {
    // Removed paddingHorizontal, use SIDE_SPACER instead
    paddingBottom: 10,
    paddingTop: 10,
    // gap: SIZES.padding.large, // REMOVE gap here
  },
  debtCardPressable: {
    marginRight: 0,
  },
  mainCardContainer: {
    display: "none",
  },
  title: {
    fontSize: SIZES.font.xlarge,
    flex: 1,
    textAlign: "center",
    paddingRight: 40,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  searchBarContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.medium,
  },
  searchBar: {
    backgroundColor: "#F5F6FA",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  friendsFlatListContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    paddingBottom: 8,
    paddingTop: 8,
  },
  friendCardPressable: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  friendPressable: { marginBottom: SIZES.padding.medium },
  modalWrapper: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "95%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: SIZES.font.xlarge,
    fontFamily: "Poppins-SemiBold",
    marginBottom: SIZES.padding.large,
    textAlign: "center",
    color: "#000",
  },
  modalFriendRow: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 8,
    gap: 0,
    width: "100%",
  },
  debtCardsBottomSpacer: {
    height: 16,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
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
  errorContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: SIZES.padding.xlarge,
  },
  errorText: {
    color: "#FF0000",
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    textAlign: "center",
  },
});

export default DebtTracking;