


import React from "react";
import { View, ScrollView, TouchableOpacity, TextInput, Text, StyleSheet, SafeAreaView } from "react-native";
import MainCard from "../../Components/CategoryCards/MainCard";
import FriendCard from "../../Components/FriendCards/FriendCard";
import BackButton from "../../Components/Buttons/BackButton";
import Ionicons from "react-native-vector-icons/Ionicons";


const DebtTracking = ({ navigation }) => {
  return (
    <>
    <BackButton navigation={navigation} />
    <View style={styles.container}>
      <Text style={styles.title}>Debt Tracking</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity onPress={() => navigation.navigate("onboarding")}>
          <MainCard
            title="Current Debts"
            amount="$17,769.88"
            description="See details"
            amountColor="white"
            backgroundColor="#37474F"
            Frame={require("../../assets/debt-tracking-animation.png")}
          />
        </TouchableOpacity>

        <Text style={styles.addDebtText}>Add Debt</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            style={styles.searchBar}
          />
        </View>

        <View style={styles.friendsContainer}>
          <FriendCard avatar={require("../../assets/Avatar01.png")} name="Jane Cooper" email="manhhachtk08@gmail.com" />
          <FriendCard avatar={require("../../assets/Avatar02.png")} name="Wade Warren" email="tienlapspktnd@gmail.com" />
          <FriendCard avatar={require("../../assets/Avatar05.png")} name="Esther Howard" email="trungkienspktnd@gmail.com" />
          <FriendCard avatar={require("../../assets/Avatar04.png")} name="Cameron Williamson" email="cktm12@gmail.com" />
          <FriendCard avatar={require("../../assets/Avatar03.png")} name="Robert Fox" email="binhan628@gmail.com" />
        </View>
      </ScrollView>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollContainer: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400, // Ensures responsiveness on larger screens
    paddingHorizontal: 20,
  },
  addDebtText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    alignSelf: "flex-start",
  },
  searchContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  friendsContainer: {
    width: "100%",
    gap: 10,
  },
});

export default DebtTracking;
