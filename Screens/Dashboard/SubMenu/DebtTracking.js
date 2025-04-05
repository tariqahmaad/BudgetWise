import React from "react";
import {
  View,
  ScrollView,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import MainCard from "../../../Components/CategoryCards/MainCard";
import FriendCard from "../../../Components/FriendCards/FriendCard";
import BackButton from "../../../Components/Buttons/BackButton";
import Ionicons from "react-native-vector-icons/Ionicons";
import ScreenWrapper from "../../../Components/ScreenWrapper";
import { COLORS, SIZES } from "../../../constants/theme";

const DebtTracking = ({ navigation }) => {
  const friends = [
    {
      id: 1,
      avatar: require("../../../assets/Avatar01.png"),
      name: "Jane Cooper",
      email: "manhhachtk08@gmail.com",
    },
    {
      id: 2,
      avatar: require("../../../assets/Avatar02.png"),
      name: "Wade Warren",
      email: "tienlapspktnd@gmail.com",
    },
    {
      id: 3,
      avatar: require("../../../assets/Avatar05.png"),
      name: "Esther Howard",
      email: "trungkienspktnd@gmail.com",
    },
    {
      id: 4,
      avatar: require("../../../assets/Avatar04.png"),
      name: "Cameron Williamson",
      email: "cktm12@gmail.com",
    },
    {
      id: 5,
      avatar: require("../../../assets/Avatar03.png"),
      name: "Robert Fox",
      email: "binhan628@gmail.com",
    },
    {
      id: 6,
      // avatar: require("../../../assets/Avatar06.png"),
      name: "Cameron Williamson",
      email: "cktm12@gmail.com",
    },
  ];

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
              title="Current Debts"
              amount="$17,769.88"
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
                  avatar={friend.avatar}
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
    width: "100%",
    marginTop: SIZES.padding.medium,
  },
  friendPressable: {
    marginBottom: SIZES.padding.medium,
  },
});

export default DebtTracking;
