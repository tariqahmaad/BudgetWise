import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import MainCard from "../../../Components/CategoryCards/MainCard";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import BackButton from "../../../Components/Buttons/BackButton";
import Ionicons from "react-native-vector-icons/Ionicons";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../../constants/theme";
import { useAuth } from "../../../context/AuthProvider";
import { firestore, collection, addDoc, onSnapshot, getDocs } from "../../../firebase/firebaseConfig";

const DebtTracking = ({ navigation }) => {
  const { user } = useAuth();

  const [friends, setFriends] = useState([]);
  const [totalDebt, setTotalDebt] = useState(0);

  useEffect(() => {
    if (!user) return;

    const friendsRef = collection(firestore, 'users', user.uid, 'friends');
    const unsubscribe = onSnapshot(friendsRef, async (snapshot) => {
      const fetchedFriends = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFriends(fetchedFriends);

      // Calculate total debt
      let total = 0;
      await Promise.all(fetchedFriends.map(async (friend) => {
        try {
          const debtsRef = collection(firestore, 'users', user.uid, 'friends', friend.id, 'debts');
          const debtsSnap = await getDocs(debtsRef);
          debtsSnap.forEach(doc => {
            const data = doc.data();
            if (data.type === 'Debt' && typeof data.amount === 'number') {
              total += data.amount;
            }
          });
        } catch (error) {
          console.error('Error fetching debts for friend:', friend.id, error);
        }
      }));
      setTotalDebt(total);
    }, (error) => {
      console.error('Error fetching friends:', error);
    });

    return unsubscribe;
  }, [user]);

  const handleBackPress = () => {
    navigation.navigate("HomeScreen");
  };

  return (
    <ScreenWrapper backgroundColor={COLORS.white}>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} />
          <Text style={styles.title}>Debt Tracking</Text>
        </View>

        <View style={styles.mainCardContainer}>
          <Pressable
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.97 : 1 }],
                transitionDuration: '200ms',
              },
              styles.cardPressable,
            ]}
            onPress={() => navigation.navigate("HomeScreen")}
          >
            <MainCard
              title="Total Debt"
              amount={`$${totalDebt.toFixed(2)}`}
              description="See details"
              amountColor="white"
              backgroundColor="#37474F"
              Frame={require("../../../assets/debt-tracking-animation.png")}
            />
          </Pressable>
        </View>

        <View style={styles.addDebtContainer}>
          <Text style={styles.addDebtText}>Add Debt</Text>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search Friends"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.searchBar}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.friendsContainer}>
            {friends.map((friend, index) => (
              <Pressable
                key={friend.id}
                onPress={() => navigation.navigate("addDebt", { friend })}
                style={({ pressed }) => [
                  styles.friendPressable,
                  {
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    transitionDuration: '200ms',
                  },
                  index === friends.length - 1 && { marginBottom: 0 },
                ]}
              >
                <FriendCard
                  avatar={require("../../../assets/Avatar01.png")}
                  name={friend.name}
                  email={friend.email}
                />
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: SIZES.padding.xxlarge,
    marginBottom: SIZES.padding.large,
  },
  mainCardContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.xxlarge,
  },
  title: {
    fontSize: SIZES.font.xlarge,
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
    color: COLORS.text,
    fontFamily: "Poppins-SemiBold",
  },
  scrollContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    paddingBottom: SIZES.padding.xxlarge,
  },
  cardPressable: {
    width: '100%',
  },
  addDebtContainer: {
    paddingHorizontal: SIZES.padding.xlarge,
    marginBottom: SIZES.padding.large,
  },
  addDebtText: {
    fontSize: SIZES.font.large,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.text,
    marginBottom: SIZES.padding.medium,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius.medium,
    paddingHorizontal: SIZES.padding.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.padding.large,
  },
  searchIcon: {
    marginRight: SIZES.padding.medium,
  },
  searchBar: {
    flex: 1,
    paddingVertical: SIZES.padding.medium,
    fontSize: SIZES.font.medium,
    fontFamily: "Poppins-Regular",
    color: COLORS.text,
  },
  friendsContainer: {
    gap: SIZES.padding.medium,
  },
  friendPressable: {
    marginBottom: SIZES.padding.medium,
  },
});

export default DebtTracking;
