//new code

import React, { useState, useEffect, useRef } from "react";
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
} from "../../../firebase/firebaseConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - SIZES.padding.xlarge * 2;
const CARD_MARGIN = 6;
const CARD_TOTAL_WIDTH = CARD_WIDTH + CARD_MARGIN * 2;
const SIDE_SPACER = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const DebtTracking = ({ navigation }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [debts, setDebts] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("owe");
  const [modalFriends, setModalFriends] = useState([]);

  // Search state
  const [search, setSearch] = useState("");

  // Debt card pagination state
  const [debtCardIndex, setDebtCardIndex] = useState(0);
  const debtCardsRef = useRef(null);

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
    let friendsUnsub = null;
    let debtsUnsubs = [];

    setLoading(true);

    const friendsRef = collection(firestore, "users", user.uid, "friends");
    friendsUnsub = onSnapshot(friendsRef, (friendsSnap) => {
      const fetchedFriends = friendsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFriends(fetchedFriends);

      debtsUnsubs.forEach((unsub) => unsub());
      debtsUnsubs = [];

      fetchedFriends.forEach((friend) => {
        const debtsRef = collection(
          firestore,
          "users",
          user.uid,
          "friends",
          friend.id,
          "debts"
        );
        const unsub = onSnapshot(debtsRef, (debtsSnap) => {
          const unpaid = debtsSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((d) => !d.paid);
          setDebts((prev) => ({
            ...prev,
            [friend.id]: unpaid,
          }));
          setLoading(false);
        });
        debtsUnsubs.push(unsub);
      });
    });

    return () => {
      if (friendsUnsub) friendsUnsub();
      debtsUnsubs.forEach((unsub) => unsub());
    };
  }, [user]);

  const { totalYouOwe, totalOwedToYou, oweList, owedList } =
    React.useMemo(() => {
      let totalYouOwe = 0,
        totalOwedToYou = 0;
      let oweList = [];
      let owedList = [];

      friends.forEach((friend) => {
        const friendDebts = debts[friend.id] || [];
        const unpaidYouOwe = friendDebts.filter((d) => d.type === "Debt");
        const unpaidTheyOwe = friendDebts.filter((d) => d.type === "Credit");

        if (unpaidYouOwe.length > 0) {
          const sum = unpaidYouOwe.reduce((sum, d) => sum + d.amount, 0);
          totalYouOwe += sum;
          oweList.push({
            friend,
            amount: sum,
            debts: unpaidYouOwe,
          });
        }

        if (unpaidTheyOwe.length > 0) {
          const sum = unpaidTheyOwe.reduce((sum, d) => sum + d.amount, 0);
          totalOwedToYou += sum;
          owedList.push({
            friend,
            amount: sum,
            debts: unpaidTheyOwe,
          });
        }
      });

      return { totalYouOwe, totalOwedToYou, oweList, owedList };
    }, [debts, friends]);

  const openModal = (type) => {
    setModalType(type);
    setModalFriends(type === "owe" ? oweList : owedList);
    setModalVisible(true);
  };

  const handleFriendPress = (friend, debts, type) => {
    navigation.navigate("Debts", {
      friendId: friend.id,
      friendName: friend.name,
      friendEmail: friend.email,
      avatar: require("../../../assets/Avatar01.png"),
      debts: debts,
      type: type,
    });
    setModalVisible(false);
  };

  const handleBackPress = () => {
    navigation.navigate("HomeScreen");
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const debtCards = [
    {
      key: "owe",
      title: "Total You Owe",
      amount: `$${totalYouOwe.toFixed(2)}`,
      description: "Tap to view & pay",
      amountColor: COLORS.LightRed,
      backgroundColor: COLORS.DeepRed,
      onPress: () => openModal("owe"),
    },
    {
      key: "owed",
      title: "Total Owed To You",
      amount: `$${totalOwedToYou.toFixed(2)}`,
      description: "Tap to view & receive",
      amountColor: COLORS.LightGreen,
      backgroundColor: COLORS.DeepGreen,
      onPress: () => openModal("owed"),
    },
  ];

  // Debt Card render for FlatList (horizontal)
  const renderDebtCard = ({ item }) => (
    <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }}>
      <Pressable onPress={item.onPress} style={styles.debtCardPressable}>
        <MainCard
          title={item.title}
          amount={item.amount}
          description={item.description}
          amountColor={item.amountColor}
          backgroundColor={item.backgroundColor}
          Frame={require("../../../assets/debt-tracking-animation.png")}
          numberOfLines={1}
          ellipsizeMode="tail"
        />
      </Pressable>
    </View>
  );

  // Pagination Dots
  const renderPaginationDots = (currentIndex, total) => (
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
  );

  // Friend Card render for FlatList (vertical)
  const renderFriendItem = ({ item: friend }) => (
    <Pressable
      onPress={() =>
        navigation.navigate("addDebt", {
          friend, // pass the whole friend object!
          debts: debts[friend.id] || [],
          type: "owe",
        })
      }
      android_ripple={{ color: "#eee" }}
      style={{ marginBottom: 12 }}
    >
      <FriendCard
        avatar={require("../../../assets/Avatar01.png")}
        name={friend.name}
        email={friend.email}
      />
    </Pressable>
  );

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
            contentContainerStyle={{
              paddingBottom: 10,
              paddingTop: 10,
              // REMOVE gap here!
            }}
            snapToInterval={CARD_TOTAL_WIDTH}
            decelerationRate="fast"
            onScroll={e => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / CARD_TOTAL_WIDTH
              );
              setDebtCardIndex(index);
            }}
            scrollEventThrottle={16}
            style={{ flexGrow: 0 }}
            ListHeaderComponent={<View style={{ width: SIDE_SPACER }} />}
            ListFooterComponent={<View style={{ width: SIDE_SPACER }} />}
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

          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 32 }}
              size="large"
              color={COLORS.primary}
            />
          ) : null}

          {/* Modal for friend list */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalWrapper}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {modalType === "owe" ? "People You Owe" : "People Who Owe You"}
                </Text>
                <FlatList
                  data={modalFriends}
                  keyExtractor={(item) => item.friend.id}
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.friendPressable,
                        {
                          transform: [{ scale: pressed ? 0.97 : 1 }],
                        },
                      ]}
                      onPress={() =>
                        handleFriendPress(item.friend, item.debts, modalType)
                      }
                    >
                      <FriendCard
                        avatar={require("../../../assets/Avatar01.png")}
                        name={item.friend.name}
                        email={item.friend.email}
                        debtAmount={item.amount}
                        youOwe={modalType === "owe"}
                      />
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={{ textAlign: "center", color: "#666" }}>
                      No records found.
                    </Text>
                  }
                />
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text
                    style={{ color: "red", marginTop: 16, textAlign: "center" }}
                  >
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
});

export default DebtTracking;