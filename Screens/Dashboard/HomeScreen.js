import { StyleSheet, Text, View, ScrollView } from "react-native";
import React from "react";
import NavigationBar from "../../Components/NavBar/NavigationBar";
import { COLORS } from "../../constants/theme";
import MainCard from "../../Components/CategoryCards/MainCard";
import SubCard from "../../Components/CategoryCards/SubCard";

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>HomeScreen</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexDireaction: "row", padding: 20 }}
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexDireaction: "row", padding: 20 }}
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
      <NavigationBar />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.appBackground,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  text: {
    color: COLORS.text,
    fontSize: 24,
  },
});
